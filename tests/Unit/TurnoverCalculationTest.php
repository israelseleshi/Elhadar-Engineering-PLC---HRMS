<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Separation;
use App\Services\TurnoverCalculationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TurnoverCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected TurnoverCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TurnoverCalculationService;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_fiscal_year_start_resolves_to_hamle_1_july_8(): void
    {
        // On or after July 8 (e.g. November 4, 2026) -> July 8, 2026
        $date1 = Carbon::parse('2026-11-04');
        $start1 = $this->service->getFiscalYearStartDate($date1);
        $this->assertEquals('2026-07-08', $start1->toDateString());

        // Exactly July 8 -> July 8 of the same year
        $date2 = Carbon::parse('2026-07-08');
        $start2 = $this->service->getFiscalYearStartDate($date2);
        $this->assertEquals('2026-07-08', $start2->toDateString());

        // Before July 8 (e.g. February 15, 2027) -> July 8 of the preceding year (2026-07-08)
        $date3 = Carbon::parse('2027-02-15');
        $start3 = $this->service->getFiscalYearStartDate($date3);
        $this->assertEquals('2026-07-08', $start3->toDateString());

        // July 7, 2026 (last day of previous fiscal year) -> July 8, 2025
        $date4 = Carbon::parse('2026-07-07');
        $start4 = $this->service->getFiscalYearStartDate($date4);
        $this->assertEquals('2025-07-08', $start4->toDateString());
    }

    public function test_turnover_rate_and_average_headcount_calculated_from_hamle_1(): void
    {
        $dept = Department::create(['name' => 'Operations']);

        // Employee 1: Hired before Hamle 1, remains active
        Employee::create([
            'file_no' => 'EMP-01',
            'full_name' => 'Abebe Bikila',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Operator',
            'employment_date_ec' => '02/05/2017',
            'employment_date' => '2025-01-10',
            'status' => 'Permanent',
        ]);

        // Employee 2: Hired before Hamle 1, separated in September (during this fiscal year)
        $emp2 = Employee::create([
            'file_no' => 'EMP-02',
            'full_name' => 'Derartu Tulu',
            'gender' => 'Female',
            'department_id' => $dept->id,
            'position' => 'Supervisor',
            'employment_date_ec' => '23/06/2017',
            'employment_date' => '2025-03-01',
            'status' => 'Separated',
        ]);
        Separation::create([
            'employee_id' => $emp2->id,
            'separation_type' => 'Resignation',
            'effective_date' => '2026-09-15',
            'basic_salary_at_separation' => 15000.00,
            'completed_years_service' => 1.5,
            'reason' => 'Personal reasons',
        ]);

        // Employee 3: Hired before Hamle 1, separated last fiscal year (should NOT count in opening or separations)
        $emp3 = Employee::create([
            'file_no' => 'EMP-03',
            'full_name' => 'Haile Gebrselassie',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Technician',
            'employment_date_ec' => '23/04/2016',
            'employment_date' => '2024-01-01',
            'status' => 'Separated',
        ]);
        Separation::create([
            'employee_id' => $emp3->id,
            'separation_type' => 'Resignation',
            'effective_date' => '2026-05-10', // Prior to Hamle 1 (2026-07-08)
            'basic_salary_at_separation' => 12000.00,
            'completed_years_service' => 2.3,
            'reason' => 'Relocated',
        ]);

        // Run calculation from Hamle 1 (2026-07-08) to today (2026-11-04)
        $startDate = Carbon::parse('2026-07-08');
        $endDate = Carbon::parse('2026-11-04');

        $result = $this->service->calculateTurnover($startDate, $endDate);

        // Opening headcount at Hamle 1 should be 2 (EMP-01 and EMP-02, since EMP-02 separated after Hamle 1)
        $this->assertEquals(2, $result['opening_headcount']);

        // Closing headcount today should be 1 (only EMP-01 is still active)
        $this->assertEquals(1, $result['closing_headcount']);

        // Average headcount from Hamle 1 till today = (2 + 1) / 2 = 1.5
        $this->assertEquals(1.5, $result['average_headcount']);

        // Separations during this fiscal year = 1 (only EMP-02)
        $this->assertEquals(1, $result['separations_count']);

        // Turnover rate = (1 / 1.5) * 100 = 66.67%
        $this->assertEquals(66.67, $result['turnover_rate']);
    }
}
