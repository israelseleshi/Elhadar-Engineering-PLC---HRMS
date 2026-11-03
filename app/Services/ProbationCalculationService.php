<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

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
