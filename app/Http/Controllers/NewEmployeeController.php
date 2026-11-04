<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewEmployeeController extends Controller
{
    /**
     * Display the roster of employees hired since the configured fiscal cutoff.
     */
    public function index(Request $request): Response
    {
        $cutoff = (string) SystemSetting::get('new_hire_cutoff_date', '2026-07-08');

        $query = Employee::with(['department', 'currentSalary'])
            ->where('employment_date', '>=', $cutoff);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('tin_no', 'like', "%{$search}%");
            });
        }

        if ($departmentId = $request->input('department_id')) {
            $query->where('department_id', $departmentId);
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
            $query->where('status', $status);
        }

        $newHires = $query->orderByDesc('employment_date')
            ->orderBy('file_no')
            ->paginate(15)
            ->withQueryString();

        $newHires->getCollection()->transform(function (Employee $employee) {
            $employee->setAttribute('days_since_joining', (int) Carbon::parse($employee->employment_date)
                ->startOfDay()
                ->diffInDays(Carbon::now()->startOfDay()));

            return $employee;
        });

        $scoped = Employee::where('employment_date', '>=', $cutoff);

        $stats = [
            'total_new_hires' => (clone $scoped)->count(),
            'probation_count' => (clone $scoped)->where('status', 'Probation')->count(),
            'permanent_count' => (clone $scoped)->where('status', 'Permanent')->count(),
            'contract_count' => (clone $scoped)->where('status', 'Contract')->count(),
            'separated_count' => (clone $scoped)->where('status', 'Separated')->count(),
            'head_office_count' => (clone $scoped)->whereIn('work_place', ['Head Office', 'H.O'])->count(),
            'project_count' => (clone $scoped)->whereNotIn('work_place', ['Head Office', 'H.O'])->count(),
            'joined_this_month' => (clone $scoped)->whereBetween('employment_date', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            'departments_represented' => (clone $scoped)->distinct()->count('department_id'),
        ];

        $departments = Department::orderBy('name')->get(['id', 'name']);

        $workplaces = Employee::where('employment_date', '>=', $cutoff)
            ->whereNotNull('work_place')
            ->where('work_place', '!=', '')
            ->distinct()
            ->orderBy('work_place')
            ->pluck('work_place');

        return Inertia::render('NewEmployees/Index', [
            'newHires' => $newHires,
            'filters' => $request->only(['search', 'department_id', 'work_place', 'status']),
            'stats' => $stats,
            'departments' => $departments,
            'workplaces' => $workplaces,
            'cutoff' => $cutoff,
        ]);
    }
}
