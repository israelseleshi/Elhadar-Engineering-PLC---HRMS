<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_edit_employee(): void
    {
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create(['department_id' => $dept->id]);

        $response = $this->get("/employees/{$employee->id}/edit");
        $response->assertRedirect('/login');

        $responsePut = $this->put("/employees/{$employee->id}", ['full_name' => 'New Name']);
        $responsePut->assertRedirect('/login');
    }

    public function test_hr_admin_can_view_employee_edit_page(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Surveying']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'file_no' => 'ELH-555',
            'full_name' => 'Daniel Melaku',
        ]);

        $response = $this->actingAs($user)->get("/employees/{$employee->id}/edit");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Edit')
            ->has('employee')
            ->where('employee.file_no', 'ELH-555')
            ->has('departments')
        );
    }

    public function test_hr_admin_can_update_employee_profile_with_audit_trail(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Design & Quality']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'file_no' => 'ELH-777',
            'full_name' => 'Original Name',
            'work_place' => 'Project',
            'position' => 'Junior Draftsman',
            'status' => 'Permanent',
            'contract_type' => 'Permanent',
            'gender' => 'Male',
            'employment_date' => '2023-01-01',
            'employment_date_ec' => '2015-04-23',
        ]);

        $payload = [
            'file_no' => 'ELH-777',
            'full_name' => 'Updated Name Senior',
            'department_id' => $dept->id,
            'work_place' => 'Head Office',
            'position' => 'Senior Draftsman',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Permanent',
            'gender' => 'Male',
            'employment_date' => '2023-01-01',
            'employment_date_ec' => '2015-04-23',
            'phone' => '+251911998877',
            'bank_name' => 'Commercial Bank of Ethiopia',
            'bank_account_no' => '100099887766',
        ];

        $response = $this->actingAs($user)->put("/employees/{$employee->id}", $payload);

        $response->assertRedirect("/employees/{$employee->id}");

        $employee->refresh();
        $this->assertEquals('Updated Name Senior', $employee->full_name);
        $this->assertEquals('Head Office', $employee->work_place);
        $this->assertEquals('Senior Draftsman', $employee->position);

        // Verify AuditLog written
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'EMPLOYEE_UPDATE',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
        ]);
    }

    public function test_hr_admin_can_record_salary_increment_with_allowances_and_pension(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Structural']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'effective_date' => '2023-01-01',
            'basic_salary' => 12000,
            'total_salary' => 12000,
            'is_current' => true,
        ]);

        $payload = [
            'basic_salary' => 18000,
            'responsibility_allowance' => 2000,
            'project_allowance' => 3000,
            'effective_date' => '2025-01-01',
            'remarks' => 'Promotion merit advancement',
        ];

        $response = $this->actingAs($user)->post("/employees/{$employee->id}/salaries", $payload);

        $response->assertRedirect();

        $employee->refresh();
        $currentSalary = $employee->currentSalary;
        $this->assertNotNull($currentSalary);
        $this->assertEquals(18000, (float) $currentSalary->basic_salary);
        $this->assertEquals(23000, (float) $currentSalary->total_salary); // 18000 + 2000 + 3000
        $this->assertEquals(1260, (float) $currentSalary->pension_employee); // 7% of 18000
        $this->assertEquals(1980, (float) $currentSalary->pension_company); // 11% of 18000

        // Verify previous salary archived
        $previousSalaries = $employee->salaries()->where('is_current', false)->get();
        $this->assertCount(1, $previousSalaries);
        $this->assertEquals(12000, (float) $previousSalaries->first()->basic_salary);

        // Verify AuditLog
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'SALARY_INCREMENT',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
        ]);
    }

    public function test_hr_admin_can_update_section_6_7_and_8_fields(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Field Engineering']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'file_no' => 'ELH-888',
            'full_name' => 'Kassahun Worku',
            'work_place' => 'Project',
            'position' => 'Field Engineer',
            'status' => 'Permanent',
            'contract_type' => 'Permanent',
            'gender' => 'Male',
            'employment_date' => '2022-01-01',
            'employment_date_ec' => '2014-04-23',
        ]);

        $payload = [
            'file_no' => 'ELH-888',
            'full_name' => 'Kassahun Worku',
            'department_id' => $dept->id,
            'work_place' => 'Project',
            'position' => 'Field Engineer',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Permanent',
            'gender' => 'Male',
            'employment_date' => '2022-01-01',
            'employment_date_ec' => '2014-04-23',
            'poessa_no' => 'POESSA-9876',
            'psssa_no' => 'PSSSA-5432',
            'plate_number' => '3-B-99881',
            'emergency_contact_name' => 'Almaz Kebede',
            'emergency_contact_relationship' => 'Spouse',
            'emergency_contact_phone' => '0911223344',
            'remarks' => 'Assigned to Amhara water project site.',
        ];

        $response = $this->actingAs($user)->put("/employees/{$employee->id}", $payload);
        $response->assertRedirect("/employees/{$employee->id}");

        $employee->refresh();
        $this->assertEquals('POESSA-9876', $employee->poessa_no);
        $this->assertEquals('PSSSA-5432', $employee->psssa_no);
        $this->assertEquals('3-B-99881', $employee->plate_number);
        $this->assertEquals('Almaz Kebede', $employee->emergency_contact_name);
        $this->assertEquals('Spouse', $employee->emergency_contact_relationship);
        $this->assertEquals('0911223344', $employee->emergency_contact_phone);
        $this->assertEquals('Assigned to Amhara water project site.', $employee->remarks);
    }
}
