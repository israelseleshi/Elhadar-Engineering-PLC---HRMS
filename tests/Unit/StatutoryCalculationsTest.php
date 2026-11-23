<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\LeaveBalance;
use App\Services\AnnualLeaveCalculationService;
use App\Services\ProbationCalculationService;
use App\Services\RetirementCalculationService;
use App\Services\SeveranceCalculationService;
use App\Services\TenureCalculationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatutoryCalculationsTest extends TestCase
{
    use RefreshDatabase;

    protected ProbationCalculationService $probationService;

    protected TenureCalculationService $tenureService;

    protected AnnualLeaveCalculationService $leaveService;

    protected RetirementCalculationService $retirementService;

    protected SeveranceCalculationService $severanceService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->probationService = new ProbationCalculationService;
        $this->tenureService = new TenureCalculationService;
        $this->leaveService = new AnnualLeaveCalculationService;
        $this->retirementService = new RetirementCalculationService;
        $this->severanceService = new SeveranceCalculationService;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_managerial_probation_is_90_calendar_days(): void
    {
        $hireDate = Carbon::parse('2025-01-01');
        $target = $this->probationService->computeTargetEndDate($hireDate, 'Managerial');

        $this->assertEquals('2025-04-01', $target->toDateString());
        $this->assertEquals(90, $hireDate->diffInDays($target));
    }

    public function test_non_managerial_probation_adds_60_working_days_excluding_sundays_and_holidays(): void
    {
        // Start on Monday, 2025-01-06
        // 2025-01-07 is Genna (Christmas) - skipped!
        // 2025-01-19 is Timket (Epiphany) - skipped!
        // Sundays are skipped!
        $hireDate = Carbon::parse('2025-01-06');
        $target = $this->probationService->computeTargetEndDate($hireDate, 'Non-Managerial');

        $this->assertTrue($target->greaterThan($hireDate->copy()->addDays(60)));
        $this->assertNotEquals(Carbon::SUNDAY, $target->dayOfWeek);
    }

    public function test_probation_service_auto_confirms_expired_probations(): void
    {
        $dept = Department::create(['name' => 'IT Dept']);
        $expiredDate = Carbon::parse('2026-09-01');

        $emp = Employee::create([
            'file_no' => 'T-999',
            'full_name' => 'Test Employee',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Developer',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'employment_date_ec' => '01/01/2018',
            'employment_date' => '2026-06-01',
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => $expiredDate->toDateString(),
        ]);

        $confirmed = $this->probationService->autoConfirmExpiredProbations(Carbon::parse('2026-09-15'));

        $this->assertCount(1, $confirmed);
        $emp->refresh();
        $this->assertEquals('Permanent', $emp->status);
        $this->assertEquals('Passed', $emp->probation_status);
        $this->assertEquals('2026-09-01', $emp->permanent_status_date->toDateString());
    }

    public function test_tenure_calculation_breaks_down_into_years_months_days(): void
    {
        Carbon::setTestNow(Carbon::parse('2023-05-25'));

        $dept = Department::create(['name' => 'Engineering Dept']);
        $employee = Employee::create([
            'file_no' => 'A-001',
            'full_name' => 'Abay Sewmehon',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Metal worker',
            'work_place' => 'Project',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'employment_date_ec' => '01/01/2015',
            'employment_date' => '2020-01-15',
            'status' => 'Permanent',
        ]);

        $tenure = $this->tenureService->calculateTenure($employee);

        $this->assertEquals(3, $tenure['years']);
        $this->assertEquals(4, $tenure['months']);
        $this->assertEquals(10, $tenure['days']);
        $this->assertStringContainsString('3 yrs, 4 mos, 10 days', $tenure['formatted']);
    }

    public function test_annual_leave_calculates_16_base_plus_1_per_2_years(): void
    {
        $dept = Department::create(['name' => 'Finance Dept']);

        // 1 Year service -> 16 days
        $emp1 = Employee::create([
            'file_no' => 'F-001',
            'full_name' => 'Tigist Assefa',
            'gender' => 'Female',
            'department_id' => $dept->id,
            'position' => 'Accountant',
            'employment_date_ec' => '01/01/2016',
            'employment_date' => Carbon::now()->subYear()->toDateString(),
            'status' => 'Permanent',
        ]);
        $this->assertEquals(16.0, $this->leaveService->calculateAnnualEntitlement($emp1));

        // 3 Years service -> 16 + Floor(2/2) = 17 days
        $emp3 = Employee::create([
            'file_no' => 'F-002',
            'full_name' => 'Kebede Tadesse',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Senior Accountant',
            'employment_date_ec' => '01/01/2014',
            'employment_date' => Carbon::now()->subYears(3)->toDateString(),
            'status' => 'Permanent',
        ]);
        $this->assertEquals(17.0, $this->leaveService->calculateAnnualEntitlement($emp3));

        // 5 Years service -> 16 + Floor(4/2) = 18 days
        $emp5 = Employee::create([
            'file_no' => 'F-003',
            'full_name' => 'Almaz Hailu',
            'gender' => 'Female',
            'department_id' => $dept->id,
            'position' => 'Finance Head',
            'employment_date_ec' => '01/01/2012',
            'employment_date' => Carbon::now()->subYears(5)->toDateString(),
            'status' => 'Permanent',
        ]);
        $this->assertEquals(18.0, $this->leaveService->calculateAnnualEntitlement($emp5));
    }

    public function test_annual_leave_prorates_first_year_of_service(): void
    {
        $dept = Department::create(['name' => 'Operations Dept']);

        // 6 months service -> 16 * (6 / 12) = 8.0 days
        $emp6m = Employee::create([
            'file_no' => 'P-001',
            'full_name' => 'Hanan Mohammed',
            'gender' => 'Female',
            'department_id' => $dept->id,
            'position' => 'Junior Clerk',
            'employment_date_ec' => '01/06/2018',
            'employment_date' => Carbon::now()->subMonths(6)->toDateString(),
            'status' => 'Probation',
        ]);
        $this->assertEquals(8.0, $this->leaveService->calculateAnnualEntitlement($emp6m, true));

        // 3 months service -> 16 * (3 / 12) = 4.0 days
        $emp3m = Employee::create([
            'file_no' => 'P-002',
            'full_name' => 'Solomon Girma',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Technician',
            'employment_date_ec' => '01/09/2018',
            'employment_date' => Carbon::now()->subMonths(3)->toDateString(),
            'status' => 'Probation',
        ]);
        $this->assertEquals(4.0, $this->leaveService->calculateAnnualEntitlement($emp3m, true));
    }

    public function test_annual_leave_carryover_and_pool_caps_at_two_years(): void
    {
        $dept = Department::create(['name' => 'Management Dept']);
        $emp = Employee::create([
            'file_no' => 'M-001',
            'full_name' => 'Yared Bekele',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Project Manager',
            'employment_date_ec' => '01/01/2014',
            'employment_date' => Carbon::now()->subYears(5)->toDateString(), // 5 yrs -> 18.0 days
            'status' => 'Permanent',
        ]);

        $maxCarryover = $this->leaveService->getMaximumAllowedCarryover($emp);
        $maxTotalPool = $this->leaveService->getMaximumTotalLeavePool($emp);

        $this->assertEquals(36.0, $maxCarryover); // 18 * 2
        $this->assertEquals(54.0, $maxTotalPool); // 18 * 3
    }

    public function test_unused_leave_payout_calculation_on_separation(): void
    {
        $dept = Department::create(['name' => 'Site Engineering']);
        $emp = Employee::create([
            'file_no' => 'S-001',
            'full_name' => 'Biruk Tadesse',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Site Supervisor',
            'employment_date_ec' => '01/01/2015',
            'employment_date' => Carbon::now()->subYears(3)->toDateString(),
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $emp->id,
            'basic_salary' => 30000.00,
            'effective_date' => Carbon::now()->subYear()->toDateString(),
            'is_current' => true,
        ]);

        LeaveBalance::create([
            'employee_id' => $emp->id,
            'leave_year' => (int) date('Y'),
            'entitled_days' => 17.0,
            'carried_over_days' => 5.0,
            'taken_days' => 9.5,
            'remaining_days' => 12.5,
        ]);

        $payout = $this->leaveService->calculateSeparationLeavePayout($emp);

        $this->assertEquals(12.5, $payout['unused_leave_days']);
        $this->assertEquals(1000.00, $payout['daily_rate']);
        $this->assertEquals(12500.00, $payout['payout_amount']);
    }

    public function test_retirement_calculates_60th_birthday_and_alerts(): void
    {
        $birthDate = Carbon::parse('1966-05-15');
        $retirementDate = $this->retirementService->calculateRetirementDate($birthDate);

        $this->assertEquals('2026-05-15', $retirementDate->toDateString());
    }

    public function test_severance_calculation_respects_first_year_and_12_month_cap(): void
    {
        $dept = Department::create(['name' => 'Engineering Dept']);
        $employee = Employee::create([
            'file_no' => 'E-001',
            'full_name' => 'Dawit Mengistu',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Site Engineer',
            'employment_date_ec' => '01/01/2015',
            'employment_date' => Carbon::parse('2019-01-01'),
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'basic_salary' => 30000.00,
            'effective_date' => '2019-01-01',
            'is_current' => true,
        ]);

        // Separated on 2024-01-01 (Exactly 5 years service)
        // Year 1: 30,000 ETB
        // Years 2-5 (4 years): 4 * (30,000 / 3) = 40,000 ETB
        // Total = 70,000 ETB
        $severance = $this->severanceService->calculateSeverance($employee, Carbon::parse('2024-01-01'));

        $this->assertEquals(30000.00, $severance['first_year_amount']);
        $this->assertEquals(40000.00, $severance['subsequent_amount']);
        $this->assertEquals(70000.00, $severance['final_payout']);
        $this->assertFalse($severance['is_capped']);
    }
}
