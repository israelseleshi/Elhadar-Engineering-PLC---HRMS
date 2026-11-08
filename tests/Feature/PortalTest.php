<?php

namespace Tests\Feature;

use App\Models\DataCorrectionReport;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_portal(): void
    {
        $response = $this->get('/portal/profile');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_ess_profile(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $dept = Department::factory()->create(['name' => 'Surveying']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'full_name' => 'Abebe Bikila',
        ]);

        $response = $this->actingAs($user)->get('/portal/profile');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Profile')
            ->has('employee')
            ->where('employee.full_name', 'Abebe Bikila')
            ->has('tenure')
            ->has('annualLeaveEntitlement')
            ->has('discrepancyReports')
        );
    }

    public function test_employee_can_submit_discrepancy_report(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'phone' => '0911000000',
        ]);

        $response = $this->actingAs($user)->post('/portal/discrepancies', [
            'field_name' => 'Telephone Number',
            'current_value' => '0911000000',
            'proposed_value' => '0911223344',
            'explanation' => 'Updated personal line.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('data_correction_reports', [
            'employee_id' => $employee->id,
            'field_name' => 'Telephone Number',
            'proposed_value' => '0911223344',
            'status' => 'Pending',
        ]);
    }

    public function test_authenticated_user_can_view_ess_leave_page(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'full_name' => 'Tirunesh Dibaba',
        ]);

        $response = $this->actingAs($user)->get('/portal/leave');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Leave')
            ->has('employee')
            ->where('employee.full_name', 'Tirunesh Dibaba')
            ->has('availableDays')
            ->has('annualLeaveEntitlement')
            ->has('leaveRequests')
            ->has('colleagues')
        );
    }

    public function test_hr_admin_can_review_discrepancy_report(): void
    {
        $admin = User::factory()->create(['role' => 'HRAdmin']);
        $employee = Employee::factory()->create();

        $report = DataCorrectionReport::create([
            'employee_id' => $employee->id,
            'field_name' => 'Bank Account',
            'proposed_value' => '1000123456789',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($admin)->patch("/portal/discrepancies/{$report->id}", [
            'status' => 'Approved',
            'reviewer_notes' => 'Verified with passbook copy.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('data_correction_reports', [
            'id' => $report->id,
            'status' => 'Approved',
            'reviewed_by' => $admin->id,
            'reviewer_notes' => 'Verified with passbook copy.',
        ]);
    }
}
