<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDiscrepancyRequest;
use App\Models\AuditLog;
use App\Models\DataCorrectionReport;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Services\AnnualLeaveCalculationService;
use App\Services\RetirementCalculationService;
use App\Services\TenureCalculationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function __construct(
        protected TenureCalculationService $tenureService,
        protected AnnualLeaveCalculationService $leaveService,
        protected RetirementCalculationService $retirementService
    ) {}

    /**
     * Display the employee self-service (ESS) read-only profile.
     */
    public function profile(Request $request): Response
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Admin-only fallback for convenience; employees/managers must be linked to their own record.
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::first();
        }

        if ($employee) {
            $employee->load([
                'department',
                'currentSalary',
                'salaries' => fn ($q) => $q->orderByDesc('effective_date'),
                'leaveBalances' => fn ($q) => $q->orderByDesc('leave_year'),
                'separation',
                'promotions',
                'dataCorrectionReports' => fn ($q) => $q->orderByDesc('created_at'),
                'leaveRequests' => fn ($q) => $q->with(['handoverEmployee:id,full_name,file_no,position', 'reviewer:id,name'])->orderByDesc('created_at'),
            ]);

            $tenure = $this->tenureService->calculateTenure($employee);
            $annualLeaveEntitlement = $this->leaveService->calculateAnnualEntitlement($employee);

            if (empty($employee->company_experience) || str_starts_with($employee->company_experience, '=') || str_contains($employee->company_experience, 'DATEDIF') || str_contains($employee->company_experience, 'Year,')) {
                $employee->company_experience = $tenure['formatted'] ?? '—';
            }
            if (empty($employee->total_experience) || str_starts_with($employee->total_experience, '=') || str_contains($employee->total_experience, 'DATEDIF') || str_contains($employee->total_experience, 'Year,')) {
                $employee->total_experience = $employee->previous_experience
                    ? "{$employee->previous_experience} + {$employee->company_experience}"
                    : $employee->company_experience;
            }

            $retirementInfo = null;
            if ($employee->birth_date) {
                $retDate = $this->retirementService->calculateRetirementDate(Carbon::parse($employee->birth_date));
                $daysRemaining = (int) Carbon::now()->diffInDays($retDate, false);
                $isRetired = $daysRemaining <= 0 || $employee->status === 'Retired';
                $isNear = $this->retirementService->isNearingRetirement(Carbon::parse($employee->birth_date));
                $statusLabel = $isRetired ? 'Retired' : ($isNear ? 'Nearing Retirement' : 'Active (Not Retired)');

                $retirementInfo = [
                    'retirement_date' => $retDate->toDateString(),
                    'days_remaining' => $daysRemaining,
                    'is_near' => $isNear,
                    'is_retired' => $isRetired,
                    'status_label' => $statusLabel,
                ];
            }
        } else {
            $tenure = ['years' => 0, 'months' => 0, 'days' => 0, 'formatted' => '0 Days'];
            $annualLeaveEntitlement = 16;
            $retirementInfo = null;
        }

        $colleagues = Employee::active()
            ->when($employee, fn ($q) => $q->where('id', '!=', $employee->id))
            ->orderBy('full_name')
            ->select('id', 'full_name', 'file_no', 'position')
            ->get();

        return Inertia::render('Portal/Profile', [
            'employee' => $employee,
            'tenure' => $tenure,
            'annualLeaveEntitlement' => $annualLeaveEntitlement,
            'retirementInfo' => $retirementInfo,
            'discrepancyReports' => $employee ? $employee->dataCorrectionReports : [],
            'leaveRequests' => $employee ? $employee->leaveRequests : [],
            'colleagues' => $colleagues,
        ]);
    }

    /**
     * Display the dedicated Employee Self-Service Leave Requests page.
     */
    public function leaveIndex(Request $request): Response
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::first();
        }

        if ($employee) {
            $employee->load([
                'department',
                'leaveBalances' => fn ($q) => $q->orderByDesc('leave_year'),
                'leaveRequests' => fn ($q) => $q->with(['handoverEmployee:id,full_name,file_no,position', 'reviewer:id,name'])->orderByDesc('created_at'),
            ]);

            $tenure = $this->tenureService->calculateTenure($employee);
            $annualLeaveEntitlement = $this->leaveService->calculateAnnualEntitlement($employee);

            $currentYear = Carbon::now()->year;
            $currentBalance = $employee->leaveBalances->firstWhere('leave_year', $currentYear);
            $availableDays = $currentBalance ? (float) $currentBalance->remaining_days : (float) $annualLeaveEntitlement;
            $approvedDaysTaken = (float) $employee->leaveRequests
                ->where('status', 'Approved')
                ->where('is_deducted', true)
                ->sum('requested_days');
            $pendingCount = $employee->leaveRequests->where('status', 'Pending')->count();
        } else {
            $tenure = ['years' => 0, 'months' => 0, 'days' => 0, 'formatted' => '0 Days'];
            $annualLeaveEntitlement = 16;
            $availableDays = 16.0;
            $approvedDaysTaken = 0.0;
            $pendingCount = 0;
        }

        $colleagues = Employee::active()
            ->when($employee, fn ($q) => $q->where('id', '!=', $employee->id))
            ->orderBy('full_name')
            ->select('id', 'full_name', 'file_no', 'position')
            ->get();

        return Inertia::render('Portal/Leave', [
            'employee' => $employee ? [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'file_no' => $employee->file_no,
                'position' => $employee->position,
                'department' => $employee->department?->name,
                'phone' => $employee->phone,
            ] : null,
            'tenure' => $tenure,
            'annualLeaveEntitlement' => $annualLeaveEntitlement,
            'availableDays' => $availableDays,
            'approvedDaysTaken' => $approvedDaysTaken,
            'pendingCount' => $pendingCount,
            'leaveRequests' => $employee ? $employee->leaveRequests : [],
            'colleagues' => $colleagues,
        ]);
    }

    /**
     * Submit a data discrepancy report for HR review.
     */
    public function reportDiscrepancy(StoreDiscrepancyRequest $request): RedirectResponse
    {
        $user = $request->user();
        $employee = $user->employee;
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::firstOrFail();
        }
        abort_unless($employee, 403, 'Your account is not linked to an employee profile.');

        $employee->dataCorrectionReports()->create([
            'field_name' => $request->validated('field_name'),
            'current_value' => $request->validated('current_value'),
            'proposed_value' => $request->validated('proposed_value'),
            'explanation' => $request->validated('explanation'),
            'status' => 'Pending',
        ]);

        return back()->with('success', 'Discrepancy report successfully submitted to HR.');
    }

    /**
     * Submit an employee leave request.
     */
    public function requestLeave(Request $request): RedirectResponse
    {
        $user = $request->user();
        $employee = $user->employee;
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::first();
        }
        abort_unless($employee, 403, 'Your account is not linked to an employee profile.');

        $validated = $request->validate([
            'leave_type' => ['required', 'string', 'in:Annual,Sick,Mourning,Marriage,Paternity,Maternity,Compassionate,Unpaid'],
            'start_date' => ['required', 'date'],
            'start_date_ec' => ['required', 'string', 'max:30'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'end_date_ec' => ['required', 'string', 'max:30'],
            'requested_days' => ['required', 'numeric', 'min:0.5', 'max:120'],
            'reason' => ['required', 'string', 'max:1000'],
            'handover_employee_id' => ['nullable', 'exists:employees,id'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'leave_type' => $validated['leave_type'],
            'start_date' => $validated['start_date'],
            'start_date_ec' => $validated['start_date_ec'],
            'end_date' => $validated['end_date'],
            'end_date_ec' => $validated['end_date_ec'],
            'requested_days' => $validated['requested_days'],
            'reason' => $validated['reason'],
            'handover_employee_id' => $validated['handover_employee_id'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'attachment_path' => $attachmentPath,
            'status' => 'Pending',
            'is_deducted' => true,
            'days_deducted' => 0.0,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LEAVE_REQUEST_SUBMITTED',
            'auditable_type' => LeaveRequest::class,
            'auditable_id' => $leaveRequest->id,
            'new_values' => $leaveRequest->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Leave request for {$validated['requested_days']} days submitted for HR review.");
    }

    /**
     * Cancel a pending employee leave request.
     */
    public function cancelLeaveRequest(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $user = $request->user();
        $employee = $user->employee;
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = $leaveRequest->employee;
        }

        abort_unless(
            $leaveRequest->employee_id === $employee?->id ||
            $leaveRequest->user_id === $user->id ||
            in_array($user->role, ['HRAdmin', 'SysAdmin'], true),
            403,
            'Unauthorized to cancel this leave request.'
        );

        abort_unless($leaveRequest->status === 'Pending', 422, 'Only pending leave requests can be cancelled.');

        $leaveRequest->update([
            'status' => 'Cancelled',
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LEAVE_REQUEST_CANCELLED',
            'auditable_type' => LeaveRequest::class,
            'auditable_id' => $leaveRequest->id,
            'new_values' => ['status' => 'Cancelled'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('info', 'Leave request cancelled.');
    }

    /**
     * Review or update a data discrepancy report (HR Admin).
     */
    public function reviewDiscrepancy(Request $request, DataCorrectionReport $report): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Approved,Rejected'],
            'reviewer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'reviewer_notes' => $validated['reviewer_notes'] ?? null,
        ]);

        if ($validated['status'] === 'Approved' && $report->employee) {
            $fieldMapping = [
                'Full Name' => 'full_name',
                'Gender' => 'gender',
                'DOB (E.C)' => 'birth_date_ec',
                'Marital Status' => 'marital_status',
                'Phone Number' => 'phone',
                'Telephone Number' => 'phone',
                'Email Address' => 'email',
                'Region' => 'region',
                'City' => 'city',
                'Sub-City' => 'sub_city',
                'Woreda' => 'woreda',
                'House No' => 'house_no',
                'Emergency Contact Name' => 'emergency_contact_name',
                'Emergency Contact Phone' => 'emergency_contact_phone',
                'Emergency Contact Relationship' => 'emergency_contact_relationship',
                'POESSA Pension No' => 'poessa_no',
                'PSSSA Pension No' => 'psssa_no',
                'Social Security Scheme No' => 'social_security_no',
                'Tax ID (TIN)' => 'tin_no',
                'Commercial Bank Name' => 'bank_name',
                'Commercial Bank Account' => 'bank_account_no',
                'Education Attainment Level' => 'education_status',
                'Institution / University' => 'institution',
                'Graduation Year (E.C.)' => 'graduation_year_ec',
                'Professional License' => 'professional_license',
                'Cost Sharing Obligation Status' => 'cost_sharing_status',
                'Position Title' => 'position',
                'Workplace / Deployment Site' => 'work_place',
                'Vehicle Plate Number' => 'plate_number',
                'Company Experience' => 'company_experience',
                'Previous Experience' => 'previous_experience',
            ];

            $col = $fieldMapping[$report->field_name] ?? $report->field_name;
            $allowedColumns = [
                'full_name', 'gender', 'birth_date_ec', 'marital_status',
                'phone', 'email', 'region', 'city', 'sub_city',
                'woreda', 'house_no', 'emergency_contact_name', 'emergency_contact_phone',
                'emergency_contact_relationship', 'tin_no', 'bank_name', 'bank_account_no',
                'social_security_no', 'poessa_no', 'psssa_no', 'education_status',
                'institution', 'graduation_year_ec', 'professional_license', 'cost_sharing_status',
                'position', 'work_place', 'plate_number',
                'company_experience', 'previous_experience',
            ];

            if (in_array($col, $allowedColumns, true)) {
                $report->employee->update([$col => $report->proposed_value]);
            }
        }

        return back()->with('success', "Discrepancy report {$validated['status']}.");
    }
}
