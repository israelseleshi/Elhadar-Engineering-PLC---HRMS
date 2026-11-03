<?php

namespace Tests\Feature;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SystemSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_settings(): void
    {
        $response = $this->get('/settings');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_settings_registry(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $response = $this->actingAs($user)->get('/settings');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Index')
            ->has('groupedSettings')
        );

        $this->assertDatabaseHas('system_settings', [
            'key' => 'pension_employee_rate',
            'value' => '7.0',
        ]);
    }

    public function test_user_can_update_statutory_parameters_and_creates_audit_log(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        // First populate defaults
        $this->actingAs($user)->get('/settings');

        $payload = [
            'settings' => [
                'pension_employee_rate' => '7.5',
                'pension_employer_rate' => '11.5',
                'statutory_retirement_age' => '62',
            ],
        ];

        $response = $this->actingAs($user)->put('/settings', $payload);

        $response->assertRedirect();

        $this->assertDatabaseHas('system_settings', [
            'key' => 'pension_employee_rate',
            'value' => '7.5',
        ]);
        $this->assertDatabaseHas('system_settings', [
            'key' => 'statutory_retirement_age',
            'value' => '62',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'SETTINGS_UPDATE',
            'auditable_type' => SystemSetting::class,
        ]);
    }
}
