<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\LeaveBalance;
use App\Models\Separation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExcelImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_excel_master_list_imports_cleanly(): void
    {
        $hasMasterFile = false;
        foreach ([
            public_path('20-02-2019 Master List.xlsx'),
            public_path('30-01-2019 Master List.xlsx'),
            database_path('data/20-02-2019 Master List.xlsx'),
            database_path('data/30-01-2019 Master List.xlsx'),
            database_path('data/EL-HADAR_ENG_HR_Master_List.xlsx'),
        ] as $path) {
            if (file_exists($path)) {
                $hasMasterFile = true;
                break;
            }
        }

        if (! $hasMasterFile) {
            $this->markTestSkipped('Master Excel file not present in repository (excluded for confidentiality).');
        }

        $this->artisan('hrms:import-excel')
            ->assertSuccessful();

        // 1. Verify permanent headcount matches master record
        $permanentCount = Employee::where('status', 'Permanent')->count();
        $this->assertGreaterThanOrEqual(100, $permanentCount);

        // 2. Verify total active & separated employees imported
        $totalEmployees = Employee::count();
        $this->assertGreaterThanOrEqual(200, $totalEmployees);

        // 3. Verify departments were created
        $this->assertGreaterThanOrEqual(10, Department::count());

        // 4. Verify employee salary records with itemized breakdown
        $salariesCount = EmployeeSalary::where('basic_salary', '>', 0)->count();
        $this->assertGreaterThanOrEqual(90, $salariesCount);

        // 5. Verify leave balances were calculated for permanent staff
        $leaveCount = LeaveBalance::count();
        $this->assertGreaterThanOrEqual(100, $leaveCount);

        // 6. Verify separation records for ex-employees
        $separationCount = Separation::count();
        $this->assertGreaterThanOrEqual(3, $separationCount);

        // 7. Verify specific known employees
        $emp1 = Employee::where('file_no', 'A-001')->first();
        $this->assertNotNull($emp1);
        $this->assertEquals('Abay Sewmehon Demena', $emp1->full_name);
        $this->assertEquals('Gilgel Gibe II Project', $emp1->work_place);
        $this->assertNotNull($emp1->currentSalary);
        $this->assertGreaterThan(0, $emp1->currentSalary->basic_salary);

        $emp2 = Employee::where('file_no', 'A-002')->first();
        $this->assertNotNull($emp2);
        $this->assertEquals('Abel Bizuayehu Haile', $emp2->full_name);
        $this->assertEquals('H.O', $emp2->work_place);
        $this->assertEquals('CEO', $emp2->position);
        $this->assertNotNull($emp2->currentSalary);
        $this->assertGreaterThan(100000, $emp2->currentSalary->basic_salary);
    }
}
