<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class RetirementCalculationService
{
    public const STATUTORY_RETIREMENT_AGE = 60;

    public const ALERT_WINDOW_DAYS = 90;

    /**
     * Calculate statutory retirement date (Birth date + 60 years).
     */
    public function calculateRetirementDate(Carbon|string $birthDate): Carbon
    {
        $date = $birthDate instanceof Carbon ? $birthDate->copy() : Carbon::parse($birthDate);

        return $date->addYears(self::STATUTORY_RETIREMENT_AGE);
    }

    /**
     * Compute remaining calendar days until statutory retirement.
     */
    public function getDaysRemaining(Employee|Carbon|string $target): ?int
    {
        if ($target instanceof Employee) {
            $retirementDate = $target->retirement_date
                ? Carbon::parse($target->retirement_date)
                : ($target->birth_date ? $this->calculateRetirementDate($target->birth_date) : null);
        } elseif ($target instanceof Carbon) {
            $retirementDate = $target;
        } else {
            $retirementDate = Carbon::parse($target);
        }

        if (! $retirementDate) {
            return null;
        }

        $now = Carbon::now()->startOfDay();
        $retirement = $retirementDate->copy()->startOfDay();

        return (int) $now->diffInDays($retirement, false);
    }

    /**
     * Determine if employee is within the 90-day POESSA alert threshold.
     */
    public function isWithinAlertWindow(Employee|Carbon|string $target): bool
    {
        $days = $this->getDaysRemaining($target);

        return $days !== null && $days >= 0 && $days <= self::ALERT_WINDOW_DAYS;
    }

    /**
     * Determine if employee/birthDate is approaching statutory retirement age (60 years).
     * Defaults to within 365 calendar days (1 year).
     */
    public function isNearingRetirement(Employee|Carbon|string $target, int $withinDays = 365): bool
    {
        if ($target instanceof Employee) {
            $birthDate = $target->birth_date ? Carbon::parse($target->birth_date) : null;
        } elseif ($target instanceof Carbon) {
            $birthDate = $target;
        } else {
            $birthDate = Carbon::parse($target);
        }

        if (! $birthDate) {
            return false;
        }

        $retirementDate = $this->calculateRetirementDate($birthDate);
        $now = Carbon::now()->startOfDay();
        $daysRemaining = (int) $now->diffInDays($retirementDate->startOfDay(), false);

        return $daysRemaining <= $withinDays && $daysRemaining >= -1825;
    }
}
