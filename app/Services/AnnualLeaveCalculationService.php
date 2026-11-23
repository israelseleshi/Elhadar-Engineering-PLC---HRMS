<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class AnnualLeaveCalculationService
{
    /**
     * Calculate statutory annual leave entitlement per Art. 77 of Proclamation 1156/2019:
     * - Base: 16 working days for year 1.
     * - +1 working day for every completed 2 years of continuous service.
     * - Prorated for incomplete first year if $prorateFirstYear is true (Art. 77(3)).
     */
    public function calculateAnnualEntitlement(Employee $employee, bool $prorateFirstYear = false, ?Carbon $asOfDate = null): float
    {
        $employmentDate = Carbon::parse($employee->employment_date);
        $now = $asOfDate ?? Carbon::now();
        $yearsOfService = (int) $employmentDate->diffInYears($now);

        if ($yearsOfService < 1) {
            if ($prorateFirstYear) {
                $completedMonths = max(0, (int) $employmentDate->diffInMonths($now));
                $prorated = round(($completedMonths / 12.0) * 16.0 * 2) / 2;

                return (float) max(0.0, min(16.0, $prorated));
            }

            return 16.0;
        }

        $incrementYears = $yearsOfService - 1;
        $bonusDays = intdiv($incrementYears, 2);

        return (float) (16.0 + $bonusDays);
    }

    /**
     * Get maximum statutory carryover allowed per Ethiopian Labour Proclamation 1156/2019 (Art. 78(5)):
     * Annual leave may not be postponed for more than two consecutive years.
     * Therefore, cumulative carryover into the current cycle cannot exceed two preceding years of entitlement.
     */
    public function getMaximumAllowedCarryover(Employee $employee): float
    {
        return (float) ($this->calculateAnnualEntitlement($employee, false) * 2.0);
    }

    /**
     * Get maximum total available leave pool in any single leave cycle
     * (Current Year Entitlement + Maximum Permitted Carryover = 3x annual entitlement).
     */
    public function getMaximumTotalLeavePool(Employee $employee): float
    {
        return (float) ($this->calculateAnnualEntitlement($employee, false) * 3.0);
    }

    /**
     * Calculate statutory wages in lieu of unused annual leave upon termination
     * per Ethiopian Labour Proclamation 1156/2019 (Art. 80(2)).
     *
     * @return array{
     *   unused_leave_days: float,
     *   daily_rate: float,
     *   payout_amount: float,
     *   leave_payout: float
     * }
     */
    public function calculateSeparationLeavePayout(Employee $employee, ?Carbon $separationDate = null): array
    {
        $sepDate = $separationDate ?? Carbon::now();
        $currentSalary = (float) ($employee->currentSalary?->basic_salary ?? 0.00);
        $dailyRate = $currentSalary > 0 ? round($currentSalary / 30.0, 2) : 0.00;

        $leaveBalance = $employee->currentLeaveBalance;
        $remainingDays = $leaveBalance
            ? (float) $leaveBalance->remaining_days
            : $this->calculateAnnualEntitlement($employee, true, $sepDate);

        // Cap payable days at statutory 2-year postponement maximum
        $maxPool = $this->getMaximumTotalLeavePool($employee);
        $payableDays = min($remainingDays, $maxPool);
        $payableDays = max(0.0, round($payableDays * 2) / 2);

        $leavePayout = round($dailyRate * $payableDays, 2);

        return [
            'unused_leave_days' => $payableDays,
            'daily_rate' => $dailyRate,
            'payout_amount' => $leavePayout,
            'leave_payout' => $leavePayout,
        ];
    }
}
