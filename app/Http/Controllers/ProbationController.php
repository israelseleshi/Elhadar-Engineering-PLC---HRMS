<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\ProbationCalculationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProbationController extends Controller
{
    public function __construct(
        protected ProbationCalculationService $probationService
    ) {}

    /**
     * Display the statutory probation pipeline board.
     */
    public function index(Request $request): Response
    {
        $statusFilter = $request->input('status', 'Probation');

        $query = Employee::with(['department', 'currentSalary']);

        if ($statusFilter === 'Probation') {
            $query->where('status', 'Probation');
        } elseif ($statusFilter === 'Passed') {
            $query->where('probation_status', 'Passed');
        } elseif ($statusFilter === 'All') {
            $query->where(function ($q) {
                $q->where('status', 'Probation')
                    ->orWhereNotNull('probation_end_date');
            });
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        $candidates = $query->orderBy('probation_end_date')->paginate(15)->withQueryString();

        // Calculate days remaining dynamically for each record
        $candidates->getCollection()->transform(function ($emp) {
            $daysRemaining = $this->probationService->getDaysRemaining($emp);
            $emp->days_remaining = $daysRemaining;
            $emp->is_urgent = ($emp->status === 'Probation' && $daysRemaining <= 15);
            $emp->is_overdue = ($emp->status === 'Probation' && $daysRemaining === 0 && Carbon::now()->greaterThanOrEqualTo(Carbon::parse($emp->probation_end_date ?? now())));

            return $emp;
        });

        $stats = [
            'total_under_probation' => Employee::where('status', 'Probation')->count(),
            'urgent_reviews' => Employee::where('status', 'Probation')
                ->whereDate('probation_end_date', '<=', Carbon::now()->addDays(15))
                ->count(),
            'confirmed_permanent' => Employee::where('probation_status', 'Passed')->count(),
        ];

        return Inertia::render('Probation/Index', [
            'candidates' => $candidates,
            'filters' => $request->only(['status', 'search']),
            'stats' => $stats,
        ]);
    }

    /**
     * Confirm an employee as Permanent following successful probation review.
     */
    public function confirmPermanent(Request $request, Employee $employee): RedirectResponse
    {
        $employee->update([
            'status' => 'Permanent',
            'probation_status' => 'Passed',
            'permanent_status_date' => now()->toDateString(),
        ]);

        return back()->with('success', "{$employee->full_name} ({$employee->file_no}) has been officially confirmed as Permanent.");
    }
}
