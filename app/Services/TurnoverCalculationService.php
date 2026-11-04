<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Separation;
use Carbon\Carbon;

class TurnoverCalculationService
{
    /**
     * Resolve the start date of the Ethiopian fiscal year (Hamle 1 / July 8)
     * for the given reference date.
     *
     * In Ethiopia, the statutory fiscal year begins on Hamle 1 (July 8).
     * If the reference date is on or after July 8, the fiscal year started on July 8 of the current calendar year.
     * If the reference date is before July 8 (e.g. Jan - early July), the fiscal year started on July 8 of the previous calendar year.
     */
    public function getFiscalYearStartDate(?Carbon $referenceDate = null): Carbon
    {
        $date = $referenceDate ? $referenceDate->copy() : Carbon::now();
        $year = (int) $date->year;

        $fiscalStartThisYear = Carbon::create($year, 7, 8)->startOfDay();

        if ($date->greaterThanOrEqualTo($fiscalStartThisYear)) {
            return $fiscalStartThisYear;
        }

        return Carbon::create($year - 1, 7, 8)->startOfDay();
    }

    /**
     * Compute turnover statistics for a given start and end date period:
     * Turnover % = (Total Separations / Average Active Headcount) * 100
     *
     * Average Headcount is calculated as:
     * (Active Headcount at Start Date + Active Headcount at End Date) / 2
     *
     * @return array{
     *   period_start: string,
     *   period_end: string,
     *   opening_headcount: int,
     *   closing_headcount: int,
     *   average_headcount: float,
     *   separations_count: int,
     *   turnover_rate: float,
     *   fiscal_year_start?: string
     * }
     */
    public function calculateTurnover(Carbon $startDate, Carbon $endDate): array
    {
        $startDateStr = $startDate->toDateString();
        $endDateStr = $endDate->toDateString();

        $separationsCount = Separation::whereBetween('effective_date', [$startDateStr, $endDateStr])->count();

        // Opening headcount on $startDate (e.g. Hamle 1):
        // Active if employed on or before $startDate AND not separated on or before $startDate.
        $openingHeadcount = Employee::where(function ($q) use ($startDateStr) {
            $q->whereNull('employment_date')
                ->orWhereDate('employment_date', '<=', $startDateStr);
        })
            ->where(function ($q) use ($startDateStr) {
                $q->where('status', '!=', 'Separated')
                    ->orWhereHas('separation', function ($sq) use ($startDateStr) {
                        $sq->whereDate('effective_date', '>', $startDateStr);
                    });
            })
            ->count();

        // Closing headcount on $endDate (e.g. current day):
        // Active if employed on or before $endDate AND not separated on or before $endDate.
        $closingHeadcount = Employee::where(function ($q) use ($endDateStr) {
            $q->whereNull('employment_date')
                ->orWhereDate('employment_date', '<=', $endDateStr);
        })
            ->where(function ($q) use ($endDateStr) {
                $q->where('status', '!=', 'Separated')
                    ->orWhereHas('separation', function ($sq) use ($endDateStr) {
                        $sq->whereDate('effective_date', '>', $endDateStr);
                    });
            })
            ->count();

        $avgHeadcount = max(1.0, ($openingHeadcount + $closingHeadcount) / 2.0);
        $turnoverRate = round(($separationsCount / $avgHeadcount) * 100.0, 2);

        return [
            'period_start' => $startDateStr,
            'period_end' => $endDateStr,
            'opening_headcount' => $openingHeadcount,
            'closing_headcount' => $closingHeadcount,
            'average_headcount' => round($avgHeadcount, 1),
            'separations_count' => $separationsCount,
            'turnover_rate' => $turnoverRate,
            'fiscal_year_start' => $startDateStr,
        ];
    }
}
