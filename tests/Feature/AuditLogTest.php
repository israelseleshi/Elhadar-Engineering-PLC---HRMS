<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_audit_logs(): void
    {
        $response = $this->get('/audit');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_audit_timeline(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'EMPLOYEE_PROMOTION',
            'auditable_type' => Employee::class,
            'auditable_id' => 1,
            'old_values' => ['position' => 'Junior Surveyor'],
            'new_values' => ['position' => 'Senior Surveyor'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit Test Agent',
        ]);

        $response = $this->actingAs($user)->get('/audit');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
            ->has('stats')
            ->has('distinctActions')
            ->where('stats.total_events', 1)
        );
    }

    public function test_audit_log_filters_by_action(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'CONFIRM_PERMANENT',
            'auditable_type' => Employee::class,
            'auditable_id' => 10,
            'ip_address' => '127.0.0.1',
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'SEPARATION_RECORD',
            'auditable_type' => Employee::class,
            'auditable_id' => 20,
            'ip_address' => '127.0.0.1',
        ]);

        $response = $this->actingAs($user)->get('/audit?action=CONFIRM_PERMANENT');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
            ->where('auditLogs.data.0.action', 'CONFIRM_PERMANENT')
        );
    }

    public function test_audit_log_detail_endpoint_returns_json_state_diff(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $log = AuditLog::create([
            'user_id' => $user->id,
            'action' => 'SALARY_ADJUSTMENT',
            'auditable_type' => Employee::class,
            'auditable_id' => 5,
            'old_values' => ['basic_salary' => 12000],
            'new_values' => ['basic_salary' => 15000],
            'ip_address' => '192.168.1.10',
            'user_agent' => 'Mozilla/5.0',
        ]);

        $response = $this->actingAs($user)->get("/audit/{$log->id}");

        $response->assertOk();
        $response->assertJson([
            'id' => $log->id,
            'action' => 'SALARY_ADJUSTMENT',
            'old_values' => ['basic_salary' => 12000],
            'new_values' => ['basic_salary' => 15000],
            'ip_address' => '192.168.1.10',
        ]);
    }
}
