<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Services\AnnualLeaveCalculationService;
use App\Services\ProbationCalculationService;
use App\Services\RetirementCalculationService;
use App\Services\TenureCalculationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected TenureCalculationService $tenureService,
        protected AnnualLeaveCalculationService $leaveService,
        protected RetirementCalculationService $retirementService,
        protected ProbationCalculationService $probationService
    ) {}

    public function create(): Response
    {
        $departments = Department::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Employees/Create', [
            'departments' => $departments,
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Calculate statutory probation end date if status is Probation
        if ($data['status'] === 'Probation') {
            $data['probation_end_date'] = $this->probationService->computeTargetEndDate(
                Carbon::parse($data['employment_date']),
                $data['employment_type']
            )->toDateString();
            $data['probation_status'] = 'Pending';
        }

        // Calculate retirement date if birth date is supplied
        if (! empty($data['birth_date'])) {
            $data['retirement_date'] = $this->retirementService->calculateRetirementDate(
                Carbon::parse($data['birth_date'])
            )->toDateString();
        }

        $employee = Employee::create($data);

        // Calculate itemized gross compensation
        $basic = (float) $data['basic_salary'];
        $resp = (float) ($data['responsibility_allowance'] ?? 0);
        $proj = (float) ($data['project_allowance'] ?? 0);
        $pos = (float) ($data['position_allowance'] ?? 0);
        $hard = (float) ($data['hardship_allowance'] ?? 0);
        $trans = (float) ($data['transport_allowance'] ?? 0);
        $house = (float) ($data['house_allowance'] ?? 0);
        $mobile = (float) ($data['mobile_allowance'] ?? 0);
        $food = (float) ($data['food_allowance'] ?? 0);
        $totalGross = $basic + $resp + $proj + $pos + $hard + $trans + $house + $mobile + $food;

        // Pension calculation: 7% employee, 11% employer
        $pensionEmployee = round($basic * 0.07, 2);
        $pensionCompany = round($basic * 0.11, 2);

        $employee->salaries()->create([
            'basic_salary' => $basic,
            'responsibility_allowance' => $resp,
            'project_allowance' => $proj,
            'position_allowance' => $pos,
            'hardship_allowance' => $hard,
            'transport_allowance' => $trans,
            'house_allowance' => $house,
            'mobile_allowance' => $mobile,
            'food_allowance' => $food,
            'total_salary' => $totalGross,
            'pension_employee' => $pensionEmployee,
            'pension_company' => $pensionCompany,
            'effective_date' => $data['employment_date'],
            'is_current' => true,
        ]);

        // Initialize statutory annual leave balance (16 base days)
        $employee->leaveBalances()->create([
            'leave_year' => (int) date('Y'),
            'entitled_days' => 16.0,
            'carried_over_days' => 0.0,
            'taken_days' => 0.0,
            'remaining_days' => 16.0,
        ]);

        return redirect()->route('employees.show', $employee->id)
            ->with('success', "Personnel profile {$employee->full_name} ({$employee->file_no}) successfully registered.");
    }

    public function edit(Employee $employee): Response
    {
        $employee->load([
            'department',
            'currentSalary',
            'salaries' => fn ($q) => $q->orderByDesc('effective_date'),
        ]);

        $departments = Department::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Employees/Edit', [
            'employee' => $employee,
            'departments' => $departments,
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();
        $oldValues = $employee->toArray();

        // Recompute retirement date if birth date was modified
        if (! empty($data['birth_date']) && $data['birth_date'] !== $employee->birth_date?->toDateString()) {
            $data['retirement_date'] = $this->retirementService->calculateRetirementDate(
                Carbon::parse($data['birth_date'])
            )->toDateString();
        }

        $employee->update($data);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'EMPLOYEE_UPDATE',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
            'old_values' => $oldValues,
            'new_values' => $employee->fresh()->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('employees.show', $employee->id)
            ->with('success', "Personnel profile {$employee->full_name} ({$employee->file_no}) successfully updated.");
    }

    public function index(Request $request): Response
    {
        $query = Employee::with(['department', 'currentSalary']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('tin_no', 'like', "%{$search}%")
                    ->orWhere('poessa_no', 'like', "%{$search}%")
                    ->orWhere('psssa_no', 'like', "%{$search}%");
            });
        }

        if ($deptInput = $request->input('department_id')) {
            $deptIds = is_array($deptInput) ? $deptInput : explode(',', (string) $deptInput);
            $deptIds = array_values(array_filter(array_map('trim', $deptIds)));
            if (! empty($deptIds)) {
                $query->whereIn('department_id', $deptIds);
            }
        }

        if ($workPlaceInput = $request->input('work_place')) {
            $workPlaces = is_array($workPlaceInput) ? $workPlaceInput : explode(',', (string) $workPlaceInput);
            $workPlaces = array_values(array_filter(array_map('trim', $workPlaces)));
            if (! empty($workPlaces)) {
                $query->where(function ($q) use ($workPlaces) {
                    $hasHO = in_array('Head Office', $workPlaces, true) || in_array('H.O', $workPlaces, true);
                    $hasProject = in_array('Project', $workPlaces, true);
                    $regularPlaces = array_diff($workPlaces, ['Head Office', 'H.O', 'Project']);

                    if ($hasHO) {
                        $q->orWhereIn('work_place', ['Head Office', 'H.O']);
                    }
                    if ($hasProject) {
                        $q->orWhereNotIn('work_place', ['Head Office', 'H.O']);
                    }
                    if (! empty($regularPlaces)) {
                        $q->orWhereIn('work_place', $regularPlaces);
                    }
                });
            }
        }

        if ($statusInput = $request->input('status')) {
            $statuses = is_array($statusInput) ? $statusInput : explode(',', (string) $statusInput);
            $statuses = array_values(array_filter(array_map('trim', $statuses)));
            if (! empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }

        if ($positionInput = $request->input('position')) {
            $positions = is_array($positionInput) ? $positionInput : explode(',', (string) $positionInput);
            $positions = array_values(array_filter(array_map('trim', $positions)));
            if (! empty($positions)) {
                $query->whereIn('position', $positions);
            }
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'file_no');
        $sortDirection = strtolower((string) $request->input('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['file_no', 'full_name', 'department_id', 'position', 'work_place', 'employment_date_ec', 'status'];

        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('file_no', 'asc');
        }

        $employees = $query->paginate(15)->withQueryString();

        $stats = [
            'total_headcount' => Employee::count(),
            'permanent_count' => Employee::where('status', 'Permanent')->count(),
            'project_count' => Employee::whereNotIn('work_place', ['Head Office', 'H.O'])->where('status', '!=', 'Separated')->count(),
            'head_office_count' => Employee::whereIn('work_place', ['Head Office', 'H.O'])->where('status', '!=', 'Separated')->count(),
            'probation_count' => Employee::where('status', 'Probation')->count(),
            'contract_count' => Employee::where('status', 'Contract')->count(),
            'separated_count' => Employee::where('status', 'Separated')->count(),
        ];

        $departments = Department::orderBy('name')->get(['id', 'name']);
        $workplaces = Employee::whereNotNull('work_place')
            ->where('work_place', '!=', '')
            ->distinct()
            ->orderBy('work_place')
            ->pluck('work_place');

        $positions = Employee::whereNotNull('position')
            ->where('position', '!=', '')
            ->distinct()
            ->orderBy('position')
            ->pluck('position');

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search', 'department_id', 'work_place', 'status', 'position', 'sort_by', 'sort_direction']),
            'stats' => $stats,
            'departments' => $departments,
            'workplaces' => $workplaces,
            'positions' => $positions,
        ]);
    }

    public function show(Employee $employee): Response
    {
        $employee->load([
            'department',
            'currentSalary',
            'salaries' => fn ($q) => $q->orderByDesc('effective_date'),
            'leaveBalances' => fn ($q) => $q->orderByDesc('leave_year'),
            'separation',
            'promotions',
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

        return Inertia::render('Employees/Show', [
            'employee' => $employee,
            'tenure' => $tenure,
            'annualLeaveEntitlement' => $annualLeaveEntitlement,
            'retirementInfo' => $retirementInfo,
        ]);
    }
}
