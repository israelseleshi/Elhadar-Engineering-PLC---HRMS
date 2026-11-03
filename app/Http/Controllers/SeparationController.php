<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeparationRequest;
use App\Models\Employee;
use App\Models\Separation;
use App\Services\SeveranceCalculationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeparationController extends Controller
{
    public function __construct(
        protected SeveranceCalculationService $severanceService
    ) {}

    /**
     * Display the employee separations roster and severance ledger.
     */
    public function index(Request $request): Response
    {
        $query = Separation::with(['employee.department', 'employee.currentSalary']);

        if ($search = $request->input('search')) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('separation_type')) {
            $query->where('separation_type', $type);
        }

        $separations = $query->orderByDesc('effective_date')->paginate(15)->withQueryString();

        $stats = [
            'total_separations' => Separation::count(),
            'total_severance_paid' => (float) Separation::where('severance_paid', true)->sum('severance_amount'),
            'pending_severance_liability' => (float) Separation::where('severance_paid', false)->sum('severance_amount'),
        ];

        $activeEmployees = Employee::with('currentSalary')
            ->where('status', '!=', 'Separated')
            ->orderBy('file_no')
            ->get(['id', 'file_no', 'full_name', 'employment_date']);

        return Inertia::render('Separations/Index', [
            'separations' => $separations,
            'filters' => $request->only(['search', 'separation_type']),
            'stats' => $stats,
            'activeEmployees' => $activeEmployees,
        ]);
    }

    /**
     * Preview statutory severance calculation for an employee prior to submission.
     */
    public function calculate(Employee $employee, Request $request): JsonResponse
    {
        $dateStr = $request->input('effective_date', now()->toDateString());
        $separationDate = Carbon::parse($dateStr);

        $calculation = $this->severanceService->calculateSeverance($employee, $separationDate);

        return response()->json($calculation);
    }

    /**
     * Record an employee separation and calculate statutory severance.
     */
    public function store(StoreSeparationRequest $request): RedirectResponse
    {
        $employee = Employee::with('currentSalary')->findOrFail($request->validated('employee_id'));
        $effectiveDate = Carbon::parse($request->validated('effective_date'));

        $calculation = $this->severanceService->calculateSeverance($employee, $effectiveDate);

        $isEligible = in_array($request->validated('separation_type'), [
            'Termination_Without_Cause',
            'Layoff',
            'Retirement',
        ], true);

        $severanceAmount = $isEligible ? $calculation['final_payout'] : 0.00;

        Separation::create([
            'employee_id' => $employee->id,
            'separation_type' => $request->validated('separation_type'),
            'effective_date' => $effectiveDate->toDateString(),
            'reason' => $request->validated('reason'),
            'basic_salary_at_separation' => $calculation['basic_salary'],
            'completed_years_service' => $calculation['years_service'],
            'severance_amount' => $severanceAmount,
            'severance_paid' => $request->boolean('severance_paid'),
        ]);

        $employee->update(['status' => 'Separated']);

        return back()->with('success', "Separation recorded for {$employee->full_name} ({$employee->file_no}).");
    }

    /**
     * Mark an accrued severance payment as disbursed.
     */
    public function markPaid(Separation $separation): RedirectResponse
    {
        $separation->update(['severance_paid' => true]);

        return back()->with('success', 'Severance payment marked as disbursed.');
    }
}
