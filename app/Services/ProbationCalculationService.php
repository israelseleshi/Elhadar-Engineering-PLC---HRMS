<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Employee;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class ProbationCalculationService
{
    /**
     * Compute target probation end date based on employment type.
     */
    public function computeTargetEndDate(Carbon $employmentDate, string $employmentType): Carbon
    {
        if ($employmentType === 'Managerial') {
            // Company Policy: 90 calendar days
            return $employmentDate->copy()->addDays(90);
        }

        // Statutory Rule: 60 Working Days (excl. Sundays and Federal Holidays)
        return $this->addWorkingDays($employmentDate, 60);
    }

    /**
     * Add N working days (Monday - Saturday), skipping Sundays and Public Holidays.
     */
    public function addWorkingDays(Carbon $startDate, int $workingDays): Carbon
    {
        $current = $startDate->copy();
        $added = 0;

        while ($added < $workingDays) {
            $current->addDay();
            // Skip Sundays (0 in Carbon)
            if ($current->dayOfWeek === Carbon::SUNDAY) {
                continue;
            }
            if ($this->isEthiopianPublicHoliday($current)) {
                continue;
            }
            $added++;
        }

        return $current;
    }

    /**
     * Calculate remaining working or calendar days until probation end date.
     */
    public function getDaysRemaining(Employee $employee): int
    {
        if (! $employee->probation_end_date) {
            return 0;
        }

        $now = Carbon::now()->startOfDay();
        $target = Carbon::parse($employee->probation_end_date)->startOfDay();

        if ($now->greaterThanOrEqualTo($target)) {
            return 0;
        }

        if ($employee->employment_type === 'Managerial') {
            return (int) $now->diffInDays($target);
        }

        // Count remaining working days
        $period = CarbonPeriod::create($now->copy()->addDay(), $target);
        $count = 0;
        foreach ($period as $day) {
            if ($day->dayOfWeek !== Carbon::SUNDAY && ! $this->isEthiopianPublicHoliday($day)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Automatically confirm employees whose statutory probation period has expired
     * without prior adverse separation action, per Ethiopian Labour Proclamation 1156/2019 (Art. 11).
     *
     * @return Collection<int, Employee>
     */
    public function autoConfirmExpiredProbations(?Carbon $asOfDate = null): Collection
    {
        $cutoffDate = ($asOfDate ?? Carbon::today())->toDateString();

        $candidates = Employee::where('status', 'Probation')
            ->where('probation_status', '!=', 'Failed')
            ->whereNotNull('probation_end_date')
            ->where('probation_end_date', '<=', $cutoffDate)
            ->get();

        if ($candidates->isEmpty()) {
            return collect();
        }

        $confirmed = collect();

        foreach ($candidates as $employee) {
            $oldValues = $employee->toArray();
            $effectiveDate = $employee->probation_end_date
                ? Carbon::parse($employee->probation_end_date)->toDateString()
                : $cutoffDate;

            $employee->update([
                'status' => 'Permanent',
                'probation_status' => 'Passed',
                'permanent_status_date' => $effectiveDate,
            ]);

            AuditLog::create([
                'user_id' => auth()->id() ?? null,
                'action' => 'PROBATION_AUTO_CONFIRMED',
                'auditable_type' => Employee::class,
                'auditable_id' => $employee->id,
                'old_values' => $oldValues,
                'new_values' => $employee->fresh()->toArray(),
                'ip_address' => request()?->ip() ?? '127.0.0.1',
                'user_agent' => request()?->userAgent() ?? 'System / CLI Auto-Scheduler',
            ]);

            $confirmed->push($employee);
        }

        return $confirmed;
    }

    /**
     * Verify whether a given date is an official Ethiopian Public Holiday.
     */
    public function isEthiopianPublicHoliday(Carbon $date): bool
    {
        $fixedHolidays = [
            '01-07', // Genna (Christmas)
            '01-19', // Timket (Epiphany)
            '03-02', // Adwa Victory Day
            '05-01', // International Labour Day
            '05-05', // Patriots' Victory Day
            '05-28', // Downfall of Derg
            '09-11', // Enkutatash (New Year)
            '09-27', // Meskel
        ];

        return in_array($date->format('m-d'), $fixedHolidays, true);
    }
}
