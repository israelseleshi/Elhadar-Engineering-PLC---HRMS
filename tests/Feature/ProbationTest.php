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
}
