<?php

namespace App\Services;

use Andegna\DateTimeFactory;
use Carbon\Carbon;
use DateTime;
use InvalidArgumentException;

class EthiopianCalendarService
{
    /**
     * Convert Ethiopian Date to Gregorian Carbon instance.
     */
    public static function toGregorian(int $year, int $month, int $day): Carbon
    {
        if ($month < 1 || $month > 13) {
            throw new InvalidArgumentException('Ethiopian month must be between 1 and 13.');
        }
        $isLeap = ($year % 4 === 3);
        $maxPagume = $isLeap ? 6 : 5;
        if ($month === 13 && ($day < 1 || $day > $maxPagume)) {
            throw new InvalidArgumentException("Pagume has {$maxPagume} days in year {$year}.");
        }
        if ($month < 13 && ($day < 1 || $day > 30)) {
            throw new InvalidArgumentException('Ethiopian months 1-12 have exactly 30 days.');
        }

        $ethiopian = DateTimeFactory::of($year, $month, $day);
        $gregorian = $ethiopian->toGregorian();

        return Carbon::instance($gregorian);
    }

    /**
     * Convert Gregorian Carbon instance to Ethiopian Date array [year, month, day, formatted].
     *
     * @return array{year: int, month: int, day: int, formatted: string}
     */
    public static function toEthiopian(Carbon|DateTime $date): array
    {
        $dt = $date instanceof Carbon ? $date->toDateTime() : $date;
        $ethiopian = DateTimeFactory::fromDateTime($dt);

        return [
            'year' => (int) $ethiopian->getYear(),
            'month' => (int) $ethiopian->getMonth(),
            'day' => (int) $ethiopian->getDay(),
            'formatted' => $ethiopian->format('d/m/Y'),
        ];
    }
}
