<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTrainingRecordRequest;
use App\Models\Employee;
use App\Models\TrainingRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainingController extends Controller
{
    /**
     * Display the training credentials and performance registry.
     */
    public function index(Request $request): Response
    {
        $query = TrainingRecord::with(['employee.department']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('training_name', 'like', "%{$search}%")
                    ->orWhere('institution', 'like', "%{$search}%")
                    ->orWhere('certificate_number', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search) {
                        $eq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('file_no', 'like', "%{$search}%");
                    });
            });
        }

        if ($score = $request->input('impact_score')) {
            $query->where('performance_impact_score', $score);
        }

        $records = $query->latest('id')->paginate(15)->withQueryString();

        $stats = [
            'total_certifications' => TrainingRecord::count(),
            'average_impact_score' => round((float) (TrainingRecord::avg('performance_impact_score') ?? 0), 1),
            'certified_staff_count' => TrainingRecord::distinct('employee_id')->count('employee_id'),
        ];

        $employees = Employee::select('id', 'file_no', 'full_name')
            ->where('status', '!=', 'Separated')
            ->orderBy('file_no')
            ->get();

        return Inertia::render('Training/Index', [
            'records' => $records,
            'filters' => $request->only(['search', 'impact_score']),
            'stats' => $stats,
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly completed training certification.
     */
    public function store(StoreTrainingRecordRequest $request): RedirectResponse
    {
        TrainingRecord::create($request->validated());

        return back()->with('success', 'Training certificate successfully registered.');
    }
}
