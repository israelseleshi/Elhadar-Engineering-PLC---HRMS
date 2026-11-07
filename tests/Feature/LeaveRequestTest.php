<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_submit_leave_request(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'Employee']);
        $dept = Department::factory()->create(['name' => 'Fabrication']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '+251911223344',
        ]);

        $colleague = Employee::factory()->create([
            'department_id' => $dept->id,
            'full_name' => 'Handover Colleague',
        ]);

        $file = UploadedFile::fake()->create('doctor_certificate.pdf', 500, 'application/pdf');

        $response = $this->actingAs($user)->post('/portal/leave-requests', [
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-14',
            'end_date_ec' => '06/03/2019 E.C.',
            'requested_days' => 5,
            'reason' => 'Annual family vacation to Hawassa.',
            'handover_employee_id' => $colleague->id,
            'contact_phone' => '+251911998877',
            'attachment' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'requested_days' => 5,
            'status' => 'Pending',
            'handover_employee_id' => $colleague->id,
        ]);

        $created = LeaveRequest::where('employee_id', $employee->id)->first();
        $this->assertNotNull($created->attachment_path);
        Storage::disk('public')->assertExists($created->attachment_path);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'LEAVE_REQUEST_SUBMITTED',
            'auditable_type' => LeaveRequest::class,
            'auditable_id' => $created->id,
        ]);
    }

    public function test_employee_can_cancel_pending_leave_request(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-12',
            'end_date_ec' => '04/03/2019 E.C.',
            'requested_days' => 3,
            'reason' => 'Personal matters',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($user)->patch("/portal/leave-requests/{$leaveRequest->id}/cancel");

        $response->assertRedirect();
        $response->assertSessionHas('info', 'Leave request cancelled.');

        $this->assertEquals('Cancelled', $leaveRequest->fresh()->status);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'LEAVE_REQUEST_CANCELLED',
            'auditable_type' => LeaveRequest::class,
            'auditable_id' => $leaveRequest->id,
        ]);
    }

    public function test_employee_cannot_cancel_other_employees_request(): void
    {
        $user1 = User::factory()->create(['role' => 'Employee']);
        $emp1 = Employee::factory()->create(['user_id' => $user1->id]);

        $user2 = User::factory()->create(['role' => 'Employee']);
        $emp2 = Employee::factory()->create(['user_id' => $user2->id]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $emp1->id,
            'user_id' => $user1->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-12',
            'end_date_ec' => '04/03/2019 E.C.',
            'requested_days' => 3,
            'reason' => 'Emp1 leave',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($user2)->patch("/portal/leave-requests/{$leaveRequest->id}/cancel");
        $response->assertForbidden();
    }

    public function test_hr_admin_can_approve_leave_request_and_deduct_balance(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'employment_date_ec' => '01/01/2010',
            'employment_date' => '2017-09-11',
        ]);

        $year = (int) date('Y');
        $initialBalance = LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_year' => $year,
            'entitled_days' => 20,
            'carried_over_days' => 0,
            'taken_days' => 2,
            'remaining_days' => 18,
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-14',
            'end_date_ec' => '06/03/2019 E.C.',
            'requested_days' => 5,
            'reason' => 'Rest vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($hrAdmin)->post("/leave/requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => true,
            'days_to_deduct' => 5,
            'reviewer_notes' => 'Approved in accordance with project schedule.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $leaveRequest->refresh();
        $this->assertEquals('Approved', $leaveRequest->status);
        $this->assertTrue((bool) $leaveRequest->is_deducted);
        $this->assertEquals(5.0, (float) $leaveRequest->days_deducted);
        $this->assertEquals($hrAdmin->id, $leaveRequest->reviewed_by);

        $initialBalance->refresh();
        $this->assertEquals(7.0, (float) $initialBalance->taken_days);
        $this->assertEquals(13.0, (float) $initialBalance->remaining_days);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $hrAdmin->id,
            'action' => 'LEAVE_REQUEST_APPROVED',
            'auditable_type' => LeaveRequest::class,
            'auditable_id' => $leaveRequest->id,
        ]);
    }

    public function test_hr_admin_can_approve_leave_request_without_deducting_balance_for_special_circumstance(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $year = (int) date('Y');
        $initialBalance = LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_year' => $year,
            'entitled_days' => 16,
            'carried_over_days' => 0,
            'taken_days' => 0,
            'remaining_days' => 16,
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Mourning',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-13',
            'end_date_ec' => '05/03/2019 E.C.',
            'requested_days' => 3,
            'reason' => 'Family bereavement per Labour Proc. 1156/2019 Art. 81',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($hrAdmin)->post("/leave/requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => false,
            'reviewer_notes' => 'Statutory special leave under Art. 81 granted with full pay and zero annual deduction.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $leaveRequest->refresh();
        $this->assertEquals('Approved', $leaveRequest->status);
        $this->assertFalse((bool) $leaveRequest->is_deducted);
        $this->assertEquals(0.0, (float) $leaveRequest->days_deducted);

        $initialBalance->refresh();
        $this->assertEquals(0.0, (float) $initialBalance->taken_days);
        $this->assertEquals(16.0, (float) $initialBalance->remaining_days);
    }

    public function test_hr_admin_can_reject_leave_request_with_reason(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-14',
            'end_date_ec' => '06/03/2019 E.C.',
            'requested_days' => 5,
            'reason' => 'Vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($hrAdmin)->post("/leave/requests/{$leaveRequest->id}/review", [
            'decision' => 'reject',
            'reviewer_notes' => 'Critical project milestone underway; please reschedule for next month.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('info');

        $leaveRequest->refresh();
        $this->assertEquals('Rejected', $leaveRequest->status);
        $this->assertFalse((bool) $leaveRequest->is_deducted);
        $this->assertEquals('Critical project milestone underway; please reschedule for next month.', $leaveRequest->reviewer_notes);
    }

    public function test_rejection_requires_reviewer_notes(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-14',
            'end_date_ec' => '06/03/2019 E.C.',
            'requested_days' => 5,
            'reason' => 'Vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($hrAdmin)->post("/leave/requests/{$leaveRequest->id}/review", [
            'decision' => 'reject',
            'reviewer_notes' => '',
        ]);

        $response->assertSessionHasErrors(['reviewer_notes']);
        $this->assertEquals('Pending', $leaveRequest->fresh()->status);
    }

    public function test_regular_employee_cannot_review_leave_requests(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'start_date_ec' => '02/03/2019 E.C.',
            'end_date' => '2026-11-14',
            'end_date_ec' => '06/03/2019 E.C.',
            'requested_days' => 5,
            'reason' => 'Vacation',
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0,
        ]);

        $response = $this->actingAs($user)->post("/leave/requests/{$leaveRequest->id}/review", [
            'decision' => 'approve',
            'deduct_balance' => true,
        ]);

        $response->assertRedirect('/portal/profile');
        $response->assertSessionHas('error');
        $this->assertEquals('Pending', $leaveRequest->fresh()->status);
    }
}
