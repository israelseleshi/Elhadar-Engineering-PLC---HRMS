<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\TrainingRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
