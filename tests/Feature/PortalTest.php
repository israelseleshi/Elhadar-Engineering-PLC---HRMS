<?php

namespace Tests\Feature;

use App\Models\DataCorrectionReport;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
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

    public function test_managerial_staff_can_view_leave_requests_page(): void
    {
        $dept = Department::factory()->create(['name' => 'Finance']);
        $managerUser = User::factory()->create(['role' => 'Employee']);
        Employee::factory()->create([
            'user_id' => $managerUser->id,
            'department_id' => $dept->id,
            'position' => 'Finance & Treasury Departmenet Manager',
        ]);
        $managerUser->refresh();

        $response = $this->actingAs($managerUser)->get('/portal/leave-requests');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/LeaveRequests')
            ->has('managerInfo')
            ->where('managerInfo.level', 'Department Manager')
            ->has('pendingRequests')
            ->has('recentReviews')
            ->has('stats')
        );
    }

    public function test_regular_non_managerial_employee_cannot_access_leave_requests_page(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        Employee::factory()->create([
            'user_id' => $user->id,
            'position' => 'Junior Accountant',
        ]);

        $response = $this->actingAs($user)->get('/portal/leave-requests');
        $response->assertForbidden();
    }

    public function test_department_manager_can_approve_staff_leave_request_and_deduct_balance(): void
    {
        $dept = Department::factory()->create(['name' => 'Engineering']);
        $managerUser = User::factory()->create(['role' => 'Employee']);
        $managerEmp = Employee::factory()->create([
            'user_id' => $managerUser->id,
            'department_id' => $dept->id,
            'position' => 'Design Department Manager',
        ]);
        $managerUser->refresh();

        $staffUser = User::factory()->create(['role' => 'Employee']);
        $staffEmp = Employee::factory()->create([
            'user_id' => $staffUser->id,
            'department_id' => $dept->id,
            'position' => 'Draftsman',
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $staffEmp->id,
            'user_id' => $staffUser->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '01/03/2019',
            'end_date' => '2026-11-13',
            'end_date_ec' => '04/03/2019',
            'requested_days' => 4.0,
            'reason' => 'Annual rest vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0.0,
        ]);

        $response = $this->actingAs($managerUser)->post("/portal/leave-requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => true,
            'days_to_deduct' => 4.0,
            'reviewer_notes' => 'Approved by Department Manager.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'Approved',
            'is_deducted' => true,
            'days_deducted' => 4.0,
            'reviewed_by' => $managerUser->id,
            'reviewer_notes' => 'Approved by Department Manager.',
        ]);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $staffEmp->id,
            'taken_days' => 4.0,
        ]);
    }

    public function test_manager_cannot_approve_their_own_leave_request(): void
    {
        $dept = Department::factory()->create(['name' => 'ICT']);
        $managerUser = User::factory()->create(['role' => 'Employee']);
        $managerEmp = Employee::factory()->create([
            'user_id' => $managerUser->id,
            'department_id' => $dept->id,
            'position' => 'ICT Directorat Director',
        ]);
        $managerUser->refresh();

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $managerEmp->id,
            'user_id' => $managerUser->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-15',
            'start_date_ec' => '06/03/2019',
            'end_date' => '2026-11-18',
            'end_date_ec' => '09/03/2019',
            'requested_days' => 3.0,
            'reason' => 'Director personal vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0.0,
        ]);

        $response = $this->actingAs($managerUser)->post("/portal/leave-requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => true,
            'days_to_deduct' => 3.0,
        ]);

        $response->assertSessionHasErrors('decision');
        $this->assertEquals('Pending', $leaveRequest->fresh()->status);
    }

    public function test_department_scoped_manager_cannot_approve_leave_for_other_department(): void
    {
        $deptA = Department::factory()->create(['name' => 'HR']);
        $deptB = Department::factory()->create(['name' => 'Finance']);

        $managerUser = User::factory()->create(['role' => 'Employee']);
        Employee::factory()->create([
            'user_id' => $managerUser->id,
            'department_id' => $deptA->id,
            'position' => 'Division Head',
        ]);
        $managerUser->refresh();

        $staffUser = User::factory()->create(['role' => 'Employee']);
        $staffEmp = Employee::factory()->create([
            'user_id' => $staffUser->id,
            'department_id' => $deptB->id,
            'position' => 'Junior Cashier',
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $staffEmp->id,
            'user_id' => $staffUser->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-20',
            'start_date_ec' => '11/03/2019',
            'end_date' => '2026-11-22',
            'end_date_ec' => '13/03/2019',
            'requested_days' => 2.0,
            'reason' => 'Family leave',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0.0,
        ]);

        $response = $this->actingAs($managerUser)->post("/portal/leave-requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => true,
            'days_to_deduct' => 2.0,
        ]);

        $response->assertForbidden();
        $this->assertEquals('Pending', $leaveRequest->fresh()->status);
    }
}
