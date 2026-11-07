<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustLeaveBalanceRequest;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Services\AnnualLeaveCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveBalanceController extends Controller
{
    public function __construct(
        protected AnnualLeaveCalculationService $leaveService
    ) {}

    /**
     * Display the statutory annual leave ledger and balances.
     */
    public function index(Request $request): Response
    {
        $year = (int) date('Y');

        $query = Employee::with(['department', 'currentLeaveBalance'])
            ->where('status', '!=', 'Separated');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        $employees = $query->orderBy('file_no')->paginate(15)->withQueryString();

        // Ensure statutory entitlements and balances are accurate
        $employees->getCollection()->transform(function ($emp) {
            $statutory = $this->leaveService->calculateAnnualEntitlement($emp);
            $emp->statutory_entitlement = $statutory;

            $balance = $emp->currentLeaveBalance;
            if (! $balance) {
                $emp->display_remaining = $statutory;
                $emp->display_taken = 0;
            } else {
                $emp->display_remaining = (float) $balance->remaining_days;
                $emp->display_taken = (float) $balance->taken_days;
            }

            return $emp;
        });

        $stats = [
            'total_leave_liability_days' => (float) (LeaveBalance::where('leave_year', $year)->sum('remaining_days') ?: (Employee::where('status', 'Permanent')->count() * 16)),
            'average_entitlement' => round((float) (Employee::where('status', '!=', 'Separated')->get()->avg(fn ($e) => $this->leaveService->calculateAnnualEntitlement($e)) ?: 16.0), 1),
            'staff_tracked_count' => Employee::where('status', '!=', 'Separated')->count(),
        ];

        $pendingRequests = LeaveRequest::with(['employee.department', 'handoverEmployee:id,full_name,file_no,position'])
            ->where('status', 'Pending')
            ->orderBy('created_at')
            ->get();

        $recentRequests = LeaveRequest::with(['employee.department', 'handoverEmployee:id,full_name,file_no,position', 'reviewer:id,name'])
            ->where('status', '!=', 'Pending')
            ->orderByDesc('reviewed_at')
            ->limit(50)
            ->get();

        return Inertia::render('Leave/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search']),
            'stats' => $stats,
            'currentYear' => $year,
            'pendingRequests' => $pendingRequests,
            'recentRequests' => $recentRequests,
            'pendingCount' => $pendingRequests->count(),
        ]);
    }

    /**
     * Review an employee leave request (Approve & Deduct, Approve Excused, or Reject).
     */
    public function reviewRequest(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:approve,reject'],
            'deduct_balance' => ['required_if:decision,approve', 'boolean'],
            'days_to_deduct' => ['nullable', 'numeric', 'min:0'],
            'reviewer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['decision'] === 'reject' && empty($validated['reviewer_notes'])) {
            return back()->withErrors(['reviewer_notes' => 'A rejection reason is required when rejecting a leave request.']);
        }

        $oldValues = $leaveRequest->toArray();

        if ($validated['decision'] === 'approve') {
            $deduct = (bool) ($validated['deduct_balance'] ?? true);
            $daysDeducted = $deduct ? (float) ($validated['days_to_deduct'] ?? $leaveRequest->requested_days) : 0.0;

            if ($deduct && $daysDeducted > 0) {
                $year = (int) date('Y');
                $statutory = $this->leaveService->calculateAnnualEntitlement($leaveRequest->employee);

                $balance = $leaveRequest->employee->leaveBalances()->firstOrCreate(
                    ['leave_year' => $year],
                    [
                        'entitled_days' => $statutory,
                        'carried_over_days' => 0,
                        'taken_days' => 0,
                        'remaining_days' => $statutory,
                    ]
                );

                $newTaken = $balance->taken_days + $daysDeducted;
                $newRemaining = max(0, ($balance->entitled_days + $balance->carried_over_days) - $newTaken);

                $balance->update([
                    'taken_days' => $newTaken,
                    'remaining_days' => $newRemaining,
                ]);
            }

            $leaveRequest->update([
                'status' => 'Approved',
                'is_deducted' => $deduct,
                'days_deducted' => $daysDeducted,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'reviewer_notes' => $validated['reviewer_notes'] ?? null,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'LEAVE_REQUEST_APPROVED',
                'auditable_type' => LeaveRequest::class,
                'auditable_id' => $leaveRequest->id,
                'old_values' => $oldValues,
                'new_values' => $leaveRequest->fresh()->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $msg = $deduct
                ? "Leave request approved with {$daysDeducted} days deducted from annual balance."
                : 'Leave request approved as Excused / Special Leave (zero balance deduction).';

            return back()->with('success', $msg);
        } else {
            $leaveRequest->update([
                'status' => 'Rejected',
                'is_deducted' => false,
                'days_deducted' => 0.0,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'reviewer_notes' => $validated['reviewer_notes'],
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'LEAVE_REQUEST_REJECTED',
                'auditable_type' => LeaveRequest::class,
                'auditable_id' => $leaveRequest->id,
                'old_values' => $oldValues,
                'new_values' => $leaveRequest->fresh()->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return back()->with('info', "Leave request rejected with reason: {$validated['reviewer_notes']}");
        }
    }

    /**
     * Deduct taken annual leave days from an employee's ledger.
     */
    public function adjust(AdjustLeaveBalanceRequest $request, Employee $employee): RedirectResponse
    {
        $year = (int) date('Y');
        $statutory = $this->leaveService->calculateAnnualEntitlement($employee);

        $balance = $employee->leaveBalances()->firstOrCreate(
            ['leave_year' => $year],
            [
                'entitled_days' => $statutory,
                'carried_over_days' => 0,
                'taken_days' => 0,
                'remaining_days' => $statutory,
            ]
        );

        $deducted = (float) $request->validated('days_deducted');
        $newTaken = $balance->taken_days + $deducted;
        $newRemaining = max(0, ($balance->entitled_days + $balance->carried_over_days) - $newTaken);

        $balance->update([
            'taken_days' => $newTaken,
            'remaining_days' => $newRemaining,
        ]);

        return back()->with('success', "Recorded {$deducted} days leave for {$employee->full_name}. Remaining balance: {$newRemaining} working days.");
    }
}
