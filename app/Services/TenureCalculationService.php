<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class TenureCalculationService
{
    /**
     * Calculate total continuous service days and human-readable tenure.
     *
     * @return array{total_days: int, years: int, months: int, days: int, formatted: string}
     */
    public function calculateTenure(Employee $employee): array
    {
        $startDate = Carbon::parse($employee->employment_date)->startOfDay();
        $endDate = $employee->status === 'Separated' && $employee->separation
            ? Carbon::parse($employee->separation->effective_date)->startOfDay()
            : Carbon::now()->startOfDay();

        $diff = $startDate->diff($endDate);
        $totalDays = (int) $startDate->diffInDays($endDate);

        $parts = [];
        if ($diff->y > 0) {
            $parts[] = "{$diff->y} ".($diff->y === 1 ? 'yr' : 'yrs');
        }
        if ($diff->m > 0) {
            $parts[] = "{$diff->m} ".($diff->m === 1 ? 'mo' : 'mos');
        }
        if ($diff->d > 0 || empty($parts)) {
            $parts[] = "{$diff->d} ".($diff->d === 1 ? 'day' : 'days');
        }

        return [
            'total_days' => $totalDays,
            'years' => $diff->y,
            'months' => $diff->m,
            'days' => $diff->d,
            'formatted' => implode(', ', $parts),
        ];
    }
}
