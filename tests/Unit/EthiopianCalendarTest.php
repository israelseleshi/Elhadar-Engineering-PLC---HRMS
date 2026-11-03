<?php

namespace Tests\Unit;

use App\Services\EthiopianCalendarService;
use Carbon\Carbon;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class EthiopianCalendarTest extends TestCase
{
    public function test_converts_ethiopian_new_year_to_gregorian(): void
    {
        // Meskerem 1, 2018 E.C. is September 11, 2025 G.C.
        $gc = EthiopianCalendarService::toGregorian(2018, 1, 1);
        $this->assertEquals('2025-09-11', $gc->toDateString());
    }

    public function test_converts_gregorian_date_to_ethiopian(): void
    {
        $gc = Carbon::createFromDate(2025, 9, 11);
        $ec = EthiopianCalendarService::toEthiopian($gc);

        $this->assertEquals(2018, $ec['year']);
        $this->assertEquals(1, $ec['month']);
        $this->assertEquals(1, $ec['day']);
        $this->assertEquals('01/01/2018', $ec['formatted']);
    }

    public function test_bi_directional_consistency_across_multiple_dates(): void
    {
        $testDates = [
            '2020-01-01',
            '2023-09-12',
            '2024-02-29', // Leap day
            '2025-10-31',
            '2026-06-15',
        ];

        foreach ($testDates as $dateStr) {
            $originalGc = Carbon::parse($dateStr);
            $ec = EthiopianCalendarService::toEthiopian($originalGc);
            $convertedGc = EthiopianCalendarService::toGregorian($ec['year'], $ec['month'], $ec['day']);

            $this->assertEquals($originalGc->toDateString(), $convertedGc->toDateString(), "Failed for {$dateStr}");
        }
    }

    public function test_throws_exception_for_invalid_month(): void
    {
        $this->expectException(InvalidArgumentException::class);
        EthiopianCalendarService::toGregorian(2017, 14, 1);
    }

    public function test_throws_exception_for_invalid_pagume_day(): void
    {
        $this->expectException(InvalidArgumentException::class);
        // Year 2017 E.C. (2017 % 4 = 1, not a leap year, so Pagume has 5 days)
        EthiopianCalendarService::toGregorian(2017, 13, 6);
    }
}
