<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePromotionRequest;
use App\Models\Employee;
use App\Models\Promotion;
use App\Services\EthiopianCalendarService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    /**
     * Display the internal promotions and career progression ledger.
     */
    public function index(Request $request): Response
    {
        $query = Promotion::with(['employee.department']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('new_position', 'like', "%{$search}%")
                    ->orWhere('previous_position', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search) {
                        $eq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('file_no', 'like', "%{$search}%");
                    });
            });
        }

        $promotions = $query->latest('promotion_date')->paginate(15)->withQueryString();

        $promotionsCollection = Promotion::all();
        $totalHikes = $promotionsCollection->sum(fn ($p) => max(0, $p->new_basic_salary - $p->previous_basic_salary));
        $avgHike = $promotionsCollection->count() > 0 ? round($totalHikes / $promotionsCollection->count(), 2) : 0.00;

        $stats = [
            'total_promotions' => Promotion::count(),
            'promotions_this_year' => Promotion::whereYear('promotion_date', date('Y'))->count(),
            'average_wage_hike' => $avgHike,
        ];

        $activeEmployees = Employee::with('currentSalary')
            ->where('status', '!=', 'Separated')
            ->orderBy('file_no')
            ->get(['id', 'file_no', 'full_name', 'position', 'grade']);

        return Inertia::render('Promotions/Index', [
            'promotions' => $promotions,
            'filters' => $request->only(['search']),
            'stats' => $stats,
            'activeEmployees' => $activeEmployees,
        ]);
    }

    /**
     * Record an internal employee promotion and update employment parameters.
     */
    public function store(StorePromotionRequest $request): RedirectResponse
    {
        $employee = Employee::with('currentSalary')->findOrFail($request->validated('employee_id'));
        $promotionDate = Carbon::parse($request->validated('promotion_date'));

        $prevBasic = (float) ($employee->currentSalary?->basic_salary ?? 0.00);
        $prevTotal = (float) ($employee->currentSalary?->total_salary ?? $prevBasic);

        $dateEc = $request->validated('promotion_date_ec');
        if (! $dateEc) {
            $conv = EthiopianCalendarService::toEthiopian($promotionDate);
            $dateEc = $conv['formatted'];
        }

        Promotion::create([
            'employee_id' => $employee->id,
            'promotion_date' => $promotionDate->toDateString(),
            'promotion_date_ec' => $dateEc,
            'previous_position' => $employee->position,
            'previous_grade' => $employee->grade,
            'previous_basic_salary' => $prevBasic,
            'previous_total_salary' => $prevTotal,
            'new_position' => $request->validated('new_position'),
            'new_grade' => $request->validated('new_grade'),
            'new_basic_salary' => $request->validated('new_basic_salary'),
            'new_total_salary' => $request->validated('new_total_salary') ?: $request->validated('new_basic_salary'),
            'remarks' => $request->validated('remarks'),
        ]);

        // Update employee profile
        $employee->update([
            'position' => $request->validated('new_position'),
            'grade' => $request->validated('new_grade') ?: $employee->grade,
        ]);

        // Archive previous salary and establish new salary milestone
        $employee->salaries()->where('is_current', true)->update(['is_current' => false]);
        $employee->salaries()->create([
            'basic_salary' => $request->validated('new_basic_salary'),
            'total_salary' => $request->validated('new_total_salary') ?: $request->validated('new_basic_salary'),
            'effective_date' => $promotionDate->toDateString(),
            'is_current' => true,
        ]);

        return back()->with('success', "Promotion registered for {$employee->full_name} ({$employee->file_no}) to {$request->validated('new_position')}.");
    }
}
