<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_contracts_pipeline(): void
    {
        $response = $this->get('/contracts');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_contracts_pipeline(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Civil Works']);

        Employee::factory()->count(4)->create([
            'department_id' => $dept->id,
            'status' => 'Contract',
            'contract_type' => 'Contract',
            'contract_end_date' => Carbon::now()->addDays(25)->toDateString(),
        ]);

        $response = $this->actingAs($user)->get('/contracts');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Contracts/Index')
            ->has('contracts.data', 4)
            ->has('stats')
            ->where('stats.total_contracts', 4)
        );
    }

    public function test_hr_admin_can_renew_contract(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create([
            'status' => 'Contract',
            'contract_end_date' => Carbon::now()->addDays(5)->toDateString(),
        ]);

        $newEndDate = Carbon::now()->addMonths(6)->toDateString();

        $response = $this->actingAs($user)->post("/contracts/{$employee->id}/renew", [
            'start_date' => Carbon::now()->toDateString(),
            'end_date' => $newEndDate,
            'project_name' => 'Addis Ababa Highway Expansion',
            'agreed_salary' => 28500.00,
            'terms_summary' => 'Renewed for phase 2 site works.',
        ]);

        $response->assertRedirect();
        $this->assertEquals($newEndDate, $employee->fresh()->contract_end_date->toDateString());
        $this->assertDatabaseHas('contract_renewals', [
            'employee_id' => $employee->id,
            'project_name' => 'Addis Ababa Highway Expansion',
            'agreed_salary' => 28500.00,
        ]);
    }
}
