<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustLeaveBalanceRequest;
use App\Models\Employee;
use App\Models\LeaveBalance;
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

        return Inertia::render('Leave/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search']),
            'stats' => $stats,
            'currentYear' => $year,
        ]);
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
