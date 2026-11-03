<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_role_is_redirected_to_portal_when_accessing_dashboard(): void
    {
        $employeeUser = User::factory()->create(['role' => 'Employee']);

        $response = $this->actingAs($employeeUser)->get('/dashboard');

        $response->assertRedirect('/portal/profile');
    }

    public function test_employee_role_cannot_access_settings_or_audit(): void
    {
        $employeeUser = User::factory()->create(['role' => 'Employee']);

        $responseSettings = $this->actingAs($employeeUser)->get('/settings');
        $responseSettings->assertRedirect('/portal/profile');

        $responseAudit = $this->actingAs($employeeUser)->get('/audit');
        $responseAudit->assertRedirect('/portal/profile');
    }

    public function test_hr_admin_has_full_access_to_administrative_console(): void
    {
        $admin = User::factory()->create(['role' => 'HRAdmin']);

        $this->actingAs($admin)->get('/settings')->assertOk();
        $this->actingAs($admin)->get('/audit')->assertOk();
        $this->actingAs($admin)->get('/employees')->assertOk();
    }

    public function test_manager_can_access_operational_views_but_not_settings(): void
    {
        $manager = User::factory()->create(['role' => 'Manager']);

        $this->actingAs($manager)->get('/employees')->assertOk();
        $this->actingAs($manager)->get('/probation')->assertOk();
        $this->actingAs($manager)->get('/contracts')->assertOk();

        // Manager cannot calibrate federal statutory settings
        $responseSettings = $this->actingAs($manager)->get('/settings');
        $responseSettings->assertForbidden();
    }
}
