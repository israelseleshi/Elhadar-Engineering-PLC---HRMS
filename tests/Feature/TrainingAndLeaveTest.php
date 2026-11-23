<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\TrainingRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainingAndLeaveTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_training_registry(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create();

        TrainingRecord::create([
            'employee_id' => $employee->id,
            'training_name' => 'Occupational Health and Safety',
            'institution' => 'Ethiopian Construction Institute',
            'performance_impact_score' => 5,
        ]);

        $response = $this->actingAs($user)->get('/training');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Training/Index')
            ->has('records.data', 1)
            ->has('stats')
            ->where('stats.total_certifications', 1)
        );
    }

    public function test_hr_admin_can_store_training_record(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create();

        $response = $this->actingAs($user)->post('/training', [
            'employee_id' => $employee->id,
            'training_name' => 'AutoCAD Civil 3D Advanced',
            'institution' => 'Addis Ababa University EiABC',
            'certificate_number' => 'EIABC-2026-99',
            'performance_impact_score' => 4,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('training_records', [
            'employee_id' => $employee->id,
            'training_name' => 'AutoCAD Civil 3D Advanced',
            'performance_impact_score' => 4,
        ]);
    }

    public function test_authenticated_user_can_view_leave_ledger(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create([
            'status' => 'Permanent',
            'employment_date' => now()->subYears(3)->toDateString(),
        ]);

        $response = $this->actingAs($user)->get('/leave');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Leave/Index')
            ->has('employees.data', 1)
            ->has('stats')
        );
    }

    public function test_hr_admin_can_deduct_leave_balance(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create([
            'status' => 'Permanent',
            'employment_date' => now()->subYears(2)->toDateString(),
        ]);

        $response = $this->actingAs($user)->post("/leave/{$employee->id}/adjust", [
            'days_deducted' => 3.5,
            'reason' => 'Annual Vacation Request',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_year' => (int) date('Y'),
            'taken_days' => 3.5,
        ]);
    }

    public function test_leave_ledger_strictly_excludes_separated_employees(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $activePermanent = Employee::factory()->create([
            'status' => 'Permanent',
            'full_name' => 'Active Permanent Staff',
            'file_no' => 'EMP-001',
            'employment_date' => now()->subYears(2)->toDateString(),
        ]);

        $activeProbation = Employee::factory()->create([
            'status' => 'Probation',
            'full_name' => 'Active Probation Staff',
            'file_no' => 'EMP-002',
            'employment_date' => now()->subMonths(2)->toDateString(),
        ]);

        $separatedEmployee = Employee::factory()->create([
            'status' => 'Separated',
            'full_name' => 'Separated Staff Member',
            'file_no' => 'SEP-001',
            'employment_date' => now()->subYears(4)->toDateString(),
        ]);

        LeaveBalance::create([
            'employee_id' => $separatedEmployee->id,
            'leave_year' => (int) date('Y'),
            'entitled_days' => 17.0,
            'carried_over_days' => 10.0,
            'taken_days' => 0.0,
            'remaining_days' => 27.0,
        ]);

        $response = $this->actingAs($user)->get('/leave');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Leave/Index')
            ->has('employees.data', 2)
            ->where('stats.staff_tracked_count', 2)
            ->where('employees.data.0.file_no', 'EMP-001')
            ->where('employees.data.1.file_no', 'EMP-002')
        );
    }

    public function test_leave_rollover_command_executes_and_caps_at_two_years(): void
    {
        $employee = Employee::factory()->create([
            'status' => 'Permanent',
            'employment_date' => now()->subYears(1)->toDateString(), // 1 yr service -> 16 days annual
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_year' => 2026,
            'entitled_days' => 16.0,
            'carried_over_days' => 30.0,
            'taken_days' => 2.0,
            'remaining_days' => 44.0, // Remaining 44 exceeds 2-yr cap (16 * 2 = 32)
        ]);

        $exitCode = Artisan::call('hrms:rollover-annual-leave', ['--year' => 2027]);
        $this->assertEquals(0, $exitCode);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_year' => 2027,
            'entitled_days' => 16.0,
            'carried_over_days' => 32.0, // Capped at 2 * 16
            'remaining_days' => 48.0,    // 16 + 32
        ]);
    }
}
