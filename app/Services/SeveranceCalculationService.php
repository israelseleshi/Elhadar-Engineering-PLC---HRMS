<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class SeveranceCalculationService
{
    /**
     * Calculate statutory severance pay per Arts. 39-41 of Proclamation 1156/2019:
     * - First year: 30 days (1 month) of basic wage.
     * - Each subsequent year: +1/3 of monthly basic wage.
     * - Pro-rated for incomplete years.
     * - Statutory cap: 12 months basic wage.
     *
     * @return array{
     *   years_service: float,
     *   basic_salary: float,
     *   first_year_amount: float,
     *   subsequent_amount: float,
     *   raw_total: float,
     *   statutory_cap: float,
     *   final_payout: float,
     *   is_capped: bool
     * }
     */
    public function calculateSeverance(Employee $employee, Carbon $separationDate): array
    {
        $currentSalary = (float) ($employee->currentSalary?->basic_salary ?? 0.00);
        $employmentDate = Carbon::parse($employee->employment_date);

        $serviceYears = max(0.0, (float) $employmentDate->floatDiffInYears($separationDate));

        // Year 1 entitlement
        $firstYearAmount = min(1.0, $serviceYears) * $currentSalary;

        // Subsequent years entitlement: 1/3 of monthly basic salary per year
        $subsequentYears = max(0.0, $serviceYears - 1.0);
        $subsequentAmount = $subsequentYears * ($currentSalary / 3.0);

        $rawTotal = $firstYearAmount + $subsequentAmount;
        $statutoryCap = 12.0 * $currentSalary;
        $finalPayout = min($rawTotal, $statutoryCap);

        return [
            'years_service' => round($serviceYears, 2),
            'basic_salary' => $currentSalary,
            'first_year_amount' => round($firstYearAmount, 2),
            'subsequent_amount' => round($subsequentAmount, 2),
            'raw_total' => round($rawTotal, 2),
            'statutory_cap' => round($statutoryCap, 2),
            'final_payout' => round($finalPayout, 2),
            'is_capped' => ($rawTotal > $statutoryCap),
        ];
    }
}
