<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Separation;
use Carbon\Carbon;

class TurnoverCalculationService
{
    /**
     * Compute turnover statistics for a given start and end date period:
     * Turnover % = (Total Separations / Average Active Headcount) * 100
     *
     * @return array{
     *   period_start: string,
     *   period_end: string,
     *   opening_headcount: int,
     *   closing_headcount: int,
     *   average_headcount: float,
     *   separations_count: int,
     *   turnover_rate: float
     * }
     */
    public function calculateTurnover(Carbon $startDate, Carbon $endDate): array
    {
        $separationsCount = Separation::whereBetween('effective_date', [$startDate, $endDate])->count();

        $openingHeadcount = Employee::where('employment_date', '<=', $startDate)
            ->where(function ($q) use ($startDate) {
                $q->whereNull('deleted_at')
                    ->orWhereHas('separation', fn ($sq) => $sq->where('effective_date', '>', $startDate));
            })->count();

        $closingHeadcount = Employee::where('employment_date', '<=', $endDate)
            ->where('status', '!=', 'Separated')
            ->count();

        $avgHeadcount = max(1.0, ($openingHeadcount + $closingHeadcount) / 2.0);
        $turnoverRate = round(($separationsCount / $avgHeadcount) * 100.0, 2);

        return [
            'period_start' => $startDate->toDateString(),
            'period_end' => $endDate->toDateString(),
            'opening_headcount' => $openingHeadcount,
            'closing_headcount' => $closingHeadcount,
            'average_headcount' => round($avgHeadcount, 1),
            'separations_count' => $separationsCount,
            'turnover_rate' => $turnoverRate,
        ];
    }
}
