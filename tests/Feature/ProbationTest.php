<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProbationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_probation_pipeline(): void
    {
        $response = $this->get('/probation');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_probation_pipeline(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Architecture']);

        Employee::factory()->count(3)->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => Carbon::now()->addDays(20)->toDateString(),
        ]);

        $response = $this->actingAs($user)->get('/probation');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Probation/Index')
            ->has('candidates.data', 3)
            ->has('stats')
            ->where('stats.total_under_probation', 3)
        );
    }

    public function test_hr_admin_can_confirm_permanent_status(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create([
            'status' => 'Probation',
            'probation_status' => 'Pending',
        ]);

        $response = $this->actingAs($user)->post("/probation/{$employee->id}/confirm");

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'status' => 'Permanent',
            'probation_status' => 'Passed',
        ]);
    }

    public function test_expired_probation_automatically_transitions_to_permanent_when_viewing_pipeline(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Architecture']);

        $expiredEndDate = Carbon::now()->subDays(5)->toDateString();

        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => $expiredEndDate,
        ]);

        $response = $this->actingAs($user)->get('/probation');

        $response->assertOk();

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'status' => 'Permanent',
            'probation_status' => 'Passed',
            'permanent_status_date' => $expiredEndDate,
        ]);
    }

    public function test_auto_confirm_probation_artisan_command_transitions_expired_employees(): void
    {
        $dept = Department::factory()->create(['name' => 'Architecture']);
        $pastDate = Carbon::now()->subDays(2)->toDateString();
        $futureDate = Carbon::now()->addDays(10)->toDateString();

        $expiredEmployee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => $pastDate,
        ]);

        $activeEmployee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => $futureDate,
        ]);

        $this->artisan('hrms:auto-confirm-probation')
            ->assertSuccessful();

        $this->assertDatabaseHas('employees', [
            'id' => $expiredEmployee->id,
            'status' => 'Permanent',
            'probation_status' => 'Passed',
            'permanent_status_date' => $pastDate,
        ]);

        $this->assertDatabaseHas('employees', [
            'id' => $activeEmployee->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
        ]);
    }

    public function test_auto_confirm_dry_run_option_does_not_modify_database(): void
    {
        $dept = Department::factory()->create(['name' => 'Architecture']);
        $pastDate = Carbon::now()->subDays(2)->toDateString();

        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'probation_end_date' => $pastDate,
        ]);

        $this->artisan('hrms:auto-confirm-probation', ['--dry-run' => true])
            ->assertSuccessful();

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'status' => 'Probation',
            'probation_status' => 'Pending',
            'permanent_status_date' => null,
        ]);
    }

    public function test_failed_probation_employees_are_not_auto_confirmed(): void
    {
        $dept = Department::factory()->create(['name' => 'Architecture']);
        $pastDate = Carbon::now()->subDays(2)->toDateString();

        $failedEmployee = Employee::factory()->create([
            'department_id' => $dept->id,
            'status' => 'Probation',
            'probation_status' => 'Failed',
            'probation_end_date' => $pastDate,
        ]);

        $this->artisan('hrms:auto-confirm-probation')
            ->assertSuccessful();

        $this->assertDatabaseHas('employees', [
            'id' => $failedEmployee->id,
            'status' => 'Probation',
            'probation_status' => 'Failed',
        ]);
    }
}
