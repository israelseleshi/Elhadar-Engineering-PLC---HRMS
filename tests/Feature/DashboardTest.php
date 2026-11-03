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

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_are_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_render_dashboard_with_all_metrics(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'HRAdmin',
        ]);

        $dept = Department::factory()->create(['name' => 'Engineering']);

        $emp1 = Employee::factory()->create([
            'file_no' => 'A-001',
            'department_id' => $dept->id,
            'position' => 'Senior Project Engineer',
            'work_place' => 'Project',
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $emp1->id,
            'effective_date' => now()->toDateString(),
            'basic_salary' => 25000,
            'gross_salary' => 30000,
            'total_salary' => 30000,
            'pension_company' => 2750,
            'pension_employee' => 1750,
            'income_tax' => 5200,
            'net_salary' => 23050,
            'is_current' => true,
        ]);

        // Probation employee
        Employee::factory()->probation()->create([
            'file_no' => 'P-001',
            'department_id' => $dept->id,
            'work_place' => 'Project',
        ]);

        // Employee nearing retirement
        Employee::factory()->nearingRetirement()->create([
            'file_no' => 'R-001',
            'department_id' => $dept->id,
            'work_place' => 'Head Office',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('metrics')
            ->where('metrics.total_active', 3)
            ->where('metrics.permanent_count', 2)
            ->where('metrics.probation_count', 1)
            ->has('alerts.probation')
            ->has('alerts.retirement')
            ->has('departmentBreakdown')
            ->has('recentStaff')
        );
    }

    public function test_dashboard_correctly_filters_retirement_candidates_without_error(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'HRAdmin',
        ]);

        $dept = Department::factory()->create(['name' => 'Operations']);

        // Eligible nearing retirement
        Employee::factory()->create([
            'file_no' => 'RET-01',
            'department_id' => $dept->id,
            'birth_date' => Carbon::now()->subYears(60)->addDays(30)->toDateString(),
            'status' => 'Permanent',
        ]);

        // Young employee
        Employee::factory()->create([
            'file_no' => 'YNG-01',
            'department_id' => $dept->id,
            'birth_date' => Carbon::now()->subYears(25)->toDateString(),
            'status' => 'Permanent',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('alerts.retirement', 1)
            ->where('alerts.retirement.0.file_no', 'RET-01')
        );
    }
}
