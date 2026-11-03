<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\Separation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeparationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_separations(): void
    {
        $response = $this->get('/separations');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_separations_list(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Surveying']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Separated',
        ]);

        Separation::create([
            'employee_id' => $employee->id,
            'separation_type' => 'Layoff',
            'effective_date' => now()->toDateString(),
            'reason' => 'Project completion downscaling',
            'basic_salary_at_separation' => 15000,
            'completed_years_service' => 3.5,
            'severance_amount' => 27500,
            'severance_paid' => false,
        ]);

        $response = $this->actingAs($user)->get('/separations');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Separations/Index')
            ->has('separations.data', 1)
            ->has('stats')
            ->has('activeEmployees')
            ->where('stats.total_separations', 1)
        );
    }

    public function test_severance_calculation_endpoint_returns_correct_formula_results(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Civil Works']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'employment_date' => Carbon::now()->subYears(3)->toDateString(),
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'effective_date' => Carbon::now()->subYears(1)->toDateString(),
            'basic_salary' => 15000,
            'total_salary' => 18000,
            'is_current' => true,
        ]);

        $response = $this->actingAs($user)->get("/separations/{$employee->id}/calculate?effective_date=".now()->toDateString());

        $response->assertOk();
        $response->assertJsonStructure([
            'years_service',
            'basic_salary',
            'first_year_amount',
            'subsequent_amount',
            'final_payout',
        ]);
        $response->assertJson([
            'basic_salary' => 15000,
            'first_year_amount' => 15000,
        ]);
    }

    public function test_hr_admin_can_record_separation_and_severance(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Civil Works']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'employment_date' => Carbon::now()->subYears(2)->toDateString(),
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'effective_date' => Carbon::now()->subYears(1)->toDateString(),
            'basic_salary' => 12000,
            'total_salary' => 14000,
            'is_current' => true,
        ]);

        $response = $this->actingAs($user)->post('/separations', [
            'employee_id' => $employee->id,
            'separation_type' => 'Layoff',
            'effective_date' => now()->toDateString(),
            'reason' => 'Contract completed',
            'severance_paid' => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('separations', [
            'employee_id' => $employee->id,
            'separation_type' => 'Layoff',
            'reason' => 'Contract completed',
            'severance_paid' => false,
        ]);

        $this->assertEquals('Separated', $employee->fresh()->status);
    }

    public function test_hr_admin_can_mark_severance_as_paid(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Civil Works']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Separated',
        ]);

        $separation = Separation::create([
            'employee_id' => $employee->id,
            'separation_type' => 'Termination_Without_Cause',
            'effective_date' => now()->toDateString(),
            'reason' => 'Restructuring',
            'basic_salary_at_separation' => 10000,
            'completed_years_service' => 2,
            'severance_amount' => 13333.33,
            'severance_paid' => false,
        ]);

        $response = $this->actingAs($user)->patch("/separations/{$separation->id}/mark-paid");

        $response->assertRedirect();
        $this->assertTrue((bool) $separation->fresh()->severance_paid);
    }
}
