<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_create_employee(): void
    {
        $response = $this->get('/employees/create');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_onboarding_form(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        Department::factory()->create(['name' => 'Human Resources']);

        $response = $this->actingAs($user)->get('/employees/create');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Create')
            ->has('departments')
        );
    }

    public function test_hr_admin_can_register_new_permanent_employee(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Design & Engineering']);

        $payload = [
            'file_no' => 'ELH-1001',
            'full_name' => 'Almaz Tesfaye Belay',
            'gender' => 'Female',
            'education_status' => 'BSc Civil Engineering',
            'marital_status' => 'Single',
            'phone' => '+251911223344',
            'email' => 'almaz.t@elhadar.com',
            'region' => 'Addis Ababa',
            'city' => 'Addis Ababa',
            'sub_city' => 'Bole',
            'woreda' => '03',
            'house_no' => '542',
            'emergency_contact_name' => 'Tesfaye Belay',
            'emergency_contact_phone' => '+251922334455',
            'department_id' => $dept->id,
            'position' => 'Senior Project Engineer',
            'work_place' => 'Project',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Permanent',
            'grade' => 'IX',
            'step' => '1',
            'employment_date' => '2025-01-01',
            'employment_date_ec' => '2017-04-23',
            'birth_date' => '1992-06-15',
            'birth_date_ec' => '1984-10-08',
            'basic_salary' => 20000,
            'responsibility_allowance' => 2500,
            'project_allowance' => 3000,
            'bank_name' => 'Commercial Bank of Ethiopia',
            'bank_account_no' => '1000123456789',
            'tin_no' => '0098765432',
            'social_security_no' => 'PO-887766',
        ];

        $response = $this->actingAs($user)->post('/employees', $payload);

        $employee = Employee::where('file_no', 'ELH-1001')->first();
        $this->assertNotNull($employee);

        $response->assertRedirect("/employees/{$employee->id}");

        $this->assertEquals('Almaz Tesfaye Belay', $employee->full_name);
        $this->assertEquals('Permanent', $employee->status);
        $this->assertEquals('Project', $employee->work_place);

        // Verify salary record created with allowances and statutory pension deductions
        $salary = $employee->currentSalary;
        $this->assertNotNull($salary);
        $this->assertEquals(20000, (float) $salary->basic_salary);
        $this->assertEquals(25500, (float) $salary->total_salary); // 20000 + 2500 + 3000
        $this->assertEquals(1400, (float) $salary->pension_employee); // 7% of 20000
        $this->assertEquals(2200, (float) $salary->pension_company); // 11% of 20000

        // Verify initial statutory leave balance initialized
        $leaveBalance = $employee->leaveBalances()->where('leave_year', (int) date('Y'))->first();
        $this->assertNotNull($leaveBalance);
        $this->assertEquals(16.0, (float) $leaveBalance->entitled_days);
        $this->assertEquals(16.0, (float) $leaveBalance->remaining_days);
    }

    public function test_hr_admin_can_register_probation_candidate_and_calculates_statutory_dates(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Operations']);

        $payload = [
            'file_no' => 'PRB-202',
            'full_name' => 'Kassahun Bekele',
            'gender' => 'Male',
            'department_id' => $dept->id,
            'position' => 'Junior Accountant',
            'work_place' => 'Head Office',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Probation',
            'employment_date' => '2025-02-01',
            'employment_date_ec' => '2017-05-24',
            'basic_salary' => 12000,
        ];

        $response = $this->actingAs($user)->post('/employees', $payload);

        $employee = Employee::where('file_no', 'PRB-202')->first();
        $this->assertNotNull($employee);

        $response->assertRedirect("/employees/{$employee->id}");

        $this->assertEquals('Probation', $employee->status);
        $this->assertEquals('Pending', $employee->probation_status);
        $this->assertNotNull($employee->probation_end_date);
    }
}
