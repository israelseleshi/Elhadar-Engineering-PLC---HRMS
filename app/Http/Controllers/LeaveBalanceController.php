<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustLeaveBalanceRequest;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\Workplace;
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

        $query = Employee::active()
            ->with(['department', 'currentLeaveBalance']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($deptId = $request->input('department_id')) {
            $query->where('department_id', $deptId);
        }

        if ($workPlace = $request->input('work_place')) {
            if ($workPlace === 'Head Office' || $workPlace === 'H.O') {
                $query->whereIn('work_place', ['Head Office', 'H.O']);
            } elseif ($workPlace === 'Project') {
                $query->whereNotIn('work_place', ['Head Office', 'H.O']);
            } else {
                $query->where('work_place', $workPlace);
            }
        }

        if ($status = $request->input('status')) {
            if ($status !== 'Separated' && in_array($status, ['Permanent', 'Probation', 'Contract'], true)) {
                $query->where('status', $status);
            }
        }

        $employees = $query->orderBy('file_no')->paginate(15)->withQueryString();

        // Ensure statutory entitlements, capped carryovers, and balances are accurate
        $employees->getCollection()->transform(function ($emp) {
            $statutory = $this->leaveService->calculateAnnualEntitlement($emp);
            $maxCarryover = $this->leaveService->getMaximumAllowedCarryover($emp);
            $emp->statutory_entitlement = $statutory;
            $emp->max_carryover = $maxCarryover;

            $balance = $emp->currentLeaveBalance;
            if (! $balance) {
                $emp->carried_over_days = 0.0;
                $emp->display_entitlement = $statutory;
                $emp->total_available = $statutory;
                $emp->display_taken = 0.0;
                $emp->display_remaining = $statutory;
            } else {
                $emp->carried_over_days = (float) $balance->carried_over_days;
                $emp->display_entitlement = (float) $balance->entitled_days;
                $emp->total_available = (float) ($balance->entitled_days + $balance->carried_over_days);
                $emp->display_taken = (float) $balance->taken_days;
                $emp->display_remaining = (float) $balance->remaining_days;
            }

            return $emp;
        });

        $activeEmployees = Employee::active();
        $stats = [
            'total_leave_liability_days' => (float) LeaveBalance::where('leave_year', $year)
                ->whereHas('employee', fn ($q) => $q->active())
                ->sum('remaining_days'),
            'average_entitlement' => round((float) ($activeEmployees->get()->avg(fn ($e) => $this->leaveService->calculateAnnualEntitlement($e)) ?: 16.0), 1),
            'staff_tracked_count' => (clone $activeEmployees)->count(),
        ];

        $pendingRequests = LeaveRequest::with(['employee.department', 'handoverEmployee:id,full_name,file_no,position', 'assignedApprover:id,name'])
            ->whereHas('employee', fn ($q) => $q->active())
            ->where('status', 'Pending')
            ->orderBy('created_at')
            ->get();

        $recentRequests = LeaveRequest::with(['employee.department', 'handoverEmployee:id,full_name,file_no,position', 'reviewer:id,name', 'assignedApprover:id,name'])
            ->whereHas('employee', fn ($q) => $q->active())
            ->where('status', '!=', 'Pending')
            ->orderByDesc('reviewed_at')
            ->limit(50)
            ->get();

        $departments = Department::orderBy('name')->get(['id', 'name']);
        $workplaces = Workplace::allDistinctNames();

        return Inertia::render('Leave/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search', 'department_id', 'work_place', 'status']),
            'stats' => $stats,
            'departments' => $departments,
            'workplaces' => $workplaces,
            'currentYear' => $year,
            'pendingRequests' => $pendingRequests,
            'recentRequests' => $recentRequests,
            'pendingCount' => $pendingRequests->count(),
        ]);
    }

    /**
     * Display the dedicated Leave Requests review dashboard for managerial staff.
     */
    public function managerialIndex(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->canApproveLeave(), 403, 'Unauthorized access: leave approvals are restricted to managerial staff.');

        $employee = $user->employee;
        $scope = $user->getManagerialScope();
        $managerLevel = $employee?->getManagerialLevel() ?? ($user->isHRAdmin() ? 'Executive / HR Admin' : 'Manager');

        // Base query for pending requests within this manager's scope
        $pendingQuery = LeaveRequest::with([
            'employee.department',
            'employee.currentLeaveBalance',
            'handoverEmployee:id,full_name,file_no,position',
            'assignedApprover:id,name',
        ])
            ->whereHas('employee', fn ($q) => $q->active())
            ->where('status', 'Pending');

        // Base query for reviewed history within this manager's scope
        $historyQuery = LeaveRequest::with([
            'employee.department',
            'employee.currentLeaveBalance',
            'handoverEmployee:id,full_name,file_no,position',
            'reviewer:id,name',
            'assignedApprover:id,name',
        ])
            ->whereHas('employee', fn ($q) => $q->active())
            ->whereIn('status', ['Approved', 'Rejected', 'Cancelled']);

        // Exclude manager's own requests (they cannot approve their own leave)
        if ($employee) {
            $pendingQuery->where('employee_id', '!=', $employee->id);
            $historyQuery->where('employee_id', '!=', $employee->id);
        }

        // Apply department scope if applicable
        if ($scope === 'department' && $employee?->department_id) {
            $deptId = $employee->department_id;
            $pendingQuery->where(function ($q) use ($deptId, $user) {
                $q->whereHas('employee', fn ($empQ) => $empQ->where('department_id', $deptId))
                    ->orWhere('assigned_to_user_id', $user->id);
            });
            $historyQuery->where(function ($q) use ($deptId, $user) {
                $q->whereHas('employee', fn ($empQ) => $empQ->where('department_id', $deptId))
                    ->orWhere('assigned_to_user_id', $user->id);
            });
        }

        $pendingRequests = $pendingQuery->orderBy('created_at')->get();
        $recentReviews = $historyQuery->orderByDesc('reviewed_at')->limit(50)->get();

        // Calculate statutory annual entitlement for employees on pending requests and review history
        $enrichEmployeeBalance = function ($req) {
            if ($req->employee) {
                $statutory = $this->leaveService->calculateAnnualEntitlement($req->employee);
                $req->employee->statutory_entitlement = $statutory;
                $balance = $req->employee->currentLeaveBalance;
                $req->employee->available_annual_days = $balance ? (float) $balance->remaining_days : (float) $statutory;
            }
        };

        $pendingRequests->each($enrichEmployeeBalance);
        $recentReviews->each($enrichEmployeeBalance);

        $year = (int) date('Y');
        $approvedCount = LeaveRequest::where('status', 'Approved')
            ->whereYear('reviewed_at', $year)
            ->when($scope === 'department' && $employee?->department_id, function ($q) use ($employee) {
                $q->whereHas('employee', fn ($empQ) => $empQ->where('department_id', $employee->department_id));
            })
            ->count();

        $rejectedCount = LeaveRequest::where('status', 'Rejected')
            ->whereYear('reviewed_at', $year)
            ->when($scope === 'department' && $employee?->department_id, function ($q) use ($employee) {
                $q->whereHas('employee', fn ($empQ) => $empQ->where('department_id', $employee->department_id));
            })
            ->count();

        return Inertia::render('Portal/LeaveRequests', [
            'managerInfo' => [
                'name' => $user->name,
                'position' => $employee?->position ?? $user->role,
                'level' => $managerLevel,
                'scope' => $scope,
                'department' => $employee?->department?->name ?? 'All Departments (Company-wide)',
            ],
            'pendingRequests' => $pendingRequests,
            'recentReviews' => $recentReviews,
            'stats' => [
                'pending_count' => $pendingRequests->count(),
                'approved_this_year' => $approvedCount,
                'rejected_this_year' => $rejectedCount,
            ],
        ]);
    }

    /**
     * Review an employee leave request (Approve & Deduct, Approve Excused, or Reject).
     */
    public function reviewRequest(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->canApproveLeave(), 403, 'Unauthorized access: leave approvals are restricted to managerial staff.');

        // Prevent self-approval
        if ($user->employee && $leaveRequest->employee_id === $user->employee->id) {
            return back()->withErrors(['decision' => 'You cannot approve or reject your own leave request.']);
        }
        if ($leaveRequest->user_id === $user->id) {
            return back()->withErrors(['decision' => 'You cannot approve or reject your own leave request.']);
        }

        // Check department scope
        if ($user->getManagerialScope() === 'department' && $user->employee?->department_id) {
            $isAssignedToMe = (int) $leaveRequest->assigned_to_user_id === (int) $user->id;
            if (! $isAssignedToMe && $leaveRequest->employee?->department_id !== $user->employee->department_id) {
                abort(403, 'You are only authorized to review leave requests within your department or specifically assigned to you.');
            }
        }

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
