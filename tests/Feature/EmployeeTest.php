<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_are_redirected_to_login_from_employee_routes(): void
    {
        $response = $this->get('/employees');
        $response->assertRedirect('/login');

        $responseShow = $this->get('/employees/1');
        $responseShow->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_employee_directory(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Engineering']);

        Employee::factory()->count(5)->create([
            'department_id' => $dept->id,
            'work_place' => 'Project',
            'status' => 'Permanent',
        ]);

        $response = $this->actingAs($user)->get('/employees');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Index')
            ->has('employees.data', 5)
            ->has('stats')
            ->has('departments')
            ->where('stats.permanent_count', 5)
        );
    }

    public function test_employee_directory_filters_by_search_department_and_workplace(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept1 = Department::factory()->create(['name' => 'Surveying']);
        $dept2 = Department::factory()->create(['name' => 'Procurement']);

        $emp1 = Employee::factory()->create([
            'file_no' => 'SRV-01',
            'full_name' => 'Solomon Girmay',
            'department_id' => $dept1->id,
            'work_place' => 'Project',
            'status' => 'Permanent',
        ]);

        $emp2 = Employee::factory()->create([
            'file_no' => 'PRC-01',
            'full_name' => 'Tigist Haile',
            'department_id' => $dept2->id,
            'work_place' => 'Head Office',
            'status' => 'Permanent',
        ]);

        // Filter by search name
        $responseSearch = $this->actingAs($user)->get('/employees?search=Solomon');
        $responseSearch->assertOk();
        $responseSearch->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Index')
            ->has('employees.data', 1)
            ->where('employees.data.0.file_no', 'SRV-01')
        );

        // Filter by workplace
        $responseWorkplace = $this->actingAs($user)->get('/employees?work_place=Head+Office');
        $responseWorkplace->assertOk();
        $responseWorkplace->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Index')
            ->has('employees.data', 1)
            ->where('employees.data.0.file_no', 'PRC-01')
        );
    }

    public function test_authenticated_user_can_view_360_degree_dossier_with_retirement_and_tenure(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Construction']);

        $employee = Employee::factory()->create([
            'file_no' => 'EMP-777',
            'full_name' => 'Dawit Mengistu',
            'department_id' => $dept->id,
            'employment_date' => Carbon::now()->subYears(4)->toDateString(),
            'birth_date' => Carbon::now()->subYears(59)->toDateString(),
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'effective_date' => now()->toDateString(),
            'basic_salary' => 18000,
            'gross_salary' => 22000,
            'total_salary' => 22000,
            'pension_company' => 1980,
            'pension_employee' => 1260,
            'income_tax' => 3800,
            'net_salary' => 16940,
            'is_current' => true,
        ]);

        $response = $this->actingAs($user)->get("/employees/{$employee->id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Show')
            ->has('employee')
            ->where('employee.file_no', 'EMP-777')
            ->has('tenure')
            ->has('annualLeaveEntitlement')
            ->has('retirementInfo')
            ->where('retirementInfo.is_near', true)
        );
    }
}
