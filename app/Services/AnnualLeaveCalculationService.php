<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class AnnualLeaveCalculationService
{
    /**
     * Calculate statutory annual leave entitlement per Art. 77 of Proclamation 1156/2019:
     * Base: 16 working days for year 1.
     * +1 working day for every completed 2 years of continuous service.
     */
    public function calculateAnnualEntitlement(Employee $employee): float
    {
        $employmentDate = Carbon::parse($employee->employment_date);
        $yearsOfService = (int) $employmentDate->diffInYears(Carbon::now());

        if ($yearsOfService < 1) {
            return 16.0;
        }

        $incrementYears = $yearsOfService - 1;
        $bonusDays = intdiv($incrementYears, 2);

        return (float) (16.0 + $bonusDays);
    }
}
