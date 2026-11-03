<?php

namespace App\Http\Controllers;

use App\Models\DataCorrectionReport;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Services\RetirementCalculationService;
use App\Services\TurnoverCalculationService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected RetirementCalculationService $retirementService,
        protected TurnoverCalculationService $turnoverService
    ) {}

    public function index(): Response
    {
        $activeEmployees = Employee::where('status', '!=', 'Separated');

        $totalActive = (clone $activeEmployees)->count();
        $permanentCount = Employee::where('status', 'Permanent')->count();
        $probationCount = Employee::where('status', 'Probation')->count();
        $contractCount = Employee::where('status', 'Contract')->count();
        $separatedCount = Employee::where('status', 'Separated')->count();

        $headOfficeCount = (clone $activeEmployees)->where(function ($q) {
            $q->where('work_place', 'H.O')
                ->orWhere('work_place', 'Head Office');
        })->count();
        $projectCount = max(0, $totalActive - $headOfficeCount);

        // Gender demographics
        $maleCount = (clone $activeEmployees)->where('gender', 'Male')->count();
        $femaleCount = (clone $activeEmployees)->where('gender', 'Female')->count();

        // Current Month Turnover Metrics
        $now = Carbon::now();
        $turnoverStats = $this->turnoverService->calculateTurnover(
            $now->copy()->startOfMonth(),
            $now->copy()->endOfMonth()
        );

        // Year-to-Date Turnover Metrics
        $ytdTurnoverStats = $this->turnoverService->calculateTurnover(
            $now->copy()->startOfYear(),
            $now->copy()->endOfDay()
        );

        // Financial & Payroll aggregates
        $currentSalaries = EmployeeSalary::where('is_current', true);
        $totalMonthlyPayroll = (float) (clone $currentSalaries)->sum('total_salary');
        $totalBasicPayroll = (float) (clone $currentSalaries)->sum('basic_salary');
        $totalAllowances = max(0.0, $totalMonthlyPayroll - $totalBasicPayroll);
        $totalPensionCompany = (float) (clone $currentSalaries)->sum('pension_company');

        // Statutory Alerts
        // 1. Probation alerts
        $probationCandidates = Employee::where('status', 'Probation')
            ->with('department')
            ->get()
            ->map(function ($emp) {
                $daysRemaining = $emp->probation_end_date
                    ? Carbon::now()->diffInDays(Carbon::parse($emp->probation_end_date), false)
                    : null;

                return [
                    'id' => $emp->id,
                    'file_no' => $emp->file_no,
                    'full_name' => $emp->full_name,
                    'position' => $emp->position,
                    'department' => $emp->department?->name,
                    'probation_end_date' => $emp->probation_end_date,
                    'days_remaining' => $daysRemaining,
                    'is_urgent' => $daysRemaining !== null && $daysRemaining <= 15,
                ];
            });

        // 2. Retirement alerts (approaching age 60)
        $retirementCandidates = Employee::where('status', '!=', 'Separated')
            ->whereNotNull('birth_date')
            ->with('department')
            ->get()
            ->filter(function ($emp) {
                return $this->retirementService->isNearingRetirement(Carbon::parse($emp->birth_date));
            })
            ->values()
            ->map(function ($emp) {
                $retDate = $this->retirementService->calculateRetirementDate(Carbon::parse($emp->birth_date));

                return [
                    'id' => $emp->id,
                    'file_no' => $emp->file_no,
                    'full_name' => $emp->full_name,
                    'position' => $emp->position,
                    'department' => $emp->department?->name,
                    'retirement_date' => $retDate->toDateString(),
                    'days_remaining' => Carbon::now()->diffInDays($retDate, false),
                ];
            });

        // 3. Pending employee data discrepancy correction requests
        $discrepancyReports = DataCorrectionReport::where('status', 'Pending')
            ->with(['employee.department'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($rep) {
                return [
                    'id' => $rep->id,
                    'employee_id' => $rep->employee_id,
                    'file_no' => $rep->employee?->file_no,
                    'full_name' => $rep->employee?->full_name,
                    'department' => $rep->employee?->department?->name,
                    'field_name' => $rep->field_name,
                    'current_value' => $rep->current_value,
                    'proposed_value' => $rep->proposed_value,
                    'explanation' => $rep->explanation,
                    'created_at' => $rep->created_at?->diffForHumans() ?? 'Recently',
                ];
            });

        $pendingDiscrepanciesCount = DataCorrectionReport::where('status', 'Pending')->count();

        // Department breakdown: All active departments
        $departmentBreakdown = Department::whereHas('employees', fn ($q) => $q->where('status', '!=', 'Separated'))
            ->withCount(['employees' => fn ($q) => $q->where('status', '!=', 'Separated')])
            ->orderByDesc('employees_count')
            ->get(['id', 'name']);

        // Workplace / Deployment breakdown
        $siteBreakdown = Employee::where('status', '!=', 'Separated')
            ->selectRaw('work_place, count(*) as count')
            ->groupBy('work_place')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($item) => [
                'name' => in_array(trim($item->work_place ?? ''), ['H.O', 'Head Office']) ? 'Head Office' : ($item->work_place ?? 'Regional Site'),
                'count' => (int) $item->count,
                'is_head_office' => in_array(trim($item->work_place ?? ''), ['H.O', 'Head Office']),
            ]);

        // Statutory Employment Tenure breakdown
        $employmentTenureBreakdown = [
            [
                'status' => 'Permanent',
                'label' => 'Permanent Roster',
                'count' => $permanentCount,
                'percentage' => $totalActive > 0 ? round(($permanentCount / $totalActive) * 100, 1) : 0,
                'fill' => '#008254',
            ],
            [
                'status' => 'Probation',
                'label' => 'Probationary Staff',
                'count' => $probationCount,
                'percentage' => $totalActive > 0 ? round(($probationCount / $totalActive) * 100, 1) : 0,
                'fill' => '#f59e0b',
            ],
            [
                'status' => 'Contract',
                'label' => 'Fixed-Term Contract',
                'count' => $contractCount,
                'percentage' => $totalActive > 0 ? round(($contractCount / $totalActive) * 100, 1) : 0,
                'fill' => '#2563eb',
            ],
        ];

        // Recent Staff additions
        $recentStaff = Employee::with(['department', 'currentSalary'])
            ->where('status', 'Permanent')
            ->orderByDesc('id')
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'total_active' => $totalActive,
                'permanent_count' => $permanentCount,
                'project_count' => $projectCount,
                'head_office_count' => $headOfficeCount,
                'probation_count' => $probationCount,
                'contract_count' => $contractCount,
                'separated_count' => $separatedCount,
                'male_count' => $maleCount,
                'female_count' => $femaleCount,
                'male_percentage' => $totalActive > 0 ? round(($maleCount / $totalActive) * 100, 1) : 0,
                'female_percentage' => $totalActive > 0 ? round(($femaleCount / $totalActive) * 100, 1) : 0,
                'turnover' => $turnoverStats,
                'ytd_turnover' => $ytdTurnoverStats,
                'total_monthly_payroll' => $totalMonthlyPayroll,
                'total_basic_payroll' => $totalBasicPayroll,
                'total_allowances' => $totalAllowances,
                'total_pension_company' => $totalPensionCompany,
                'pending_discrepancies_count' => $pendingDiscrepanciesCount,
            ],
            'alerts' => [
                'probation' => $probationCandidates,
                'retirement' => $retirementCandidates,
                'discrepancies' => $discrepancyReports,
            ],
            'departmentBreakdown' => $departmentBreakdown,
            'siteBreakdown' => $siteBreakdown,
            'employmentTenureBreakdown' => $employmentTenureBreakdown,
            'recentStaff' => $recentStaff,
        ]);
    }
}
