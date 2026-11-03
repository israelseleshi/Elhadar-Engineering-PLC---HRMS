<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContractRenewalRequest;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    /**
     * Display the fixed-term project contract pipeline board.
     */
    public function index(Request $request): Response
    {
        $urgency = $request->input('urgency', 'all');

        $query = Employee::with(['department', 'currentSalary', 'contractRenewals' => fn ($q) => $q->latest()]);

        $query->where(function ($q) {
            $q->where('status', 'Contract')
                ->orWhereNotNull('contract_end_date');
        });

        if ($urgency === 'expiring_30') {
            $query->whereBetween('contract_end_date', [Carbon::now()->subDays(1), Carbon::now()->addDays(30)]);
        } elseif ($urgency === 'expiring_15') {
            $query->whereBetween('contract_end_date', [Carbon::now()->subDays(1), Carbon::now()->addDays(15)]);
        } elseif ($urgency === 'expired') {
            $query->where('contract_end_date', '<', Carbon::now()->toDateString());
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('file_no', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        $contracts = $query->orderBy('contract_end_date')->paginate(15)->withQueryString();

        $now = Carbon::now();
        $contracts->getCollection()->transform(function ($emp) use ($now) {
            if ($emp->contract_end_date) {
                $end = Carbon::parse($emp->contract_end_date);
                $diff = (int) $now->diffInDays($end, false);
                $emp->days_until_expiration = $diff;
                $emp->is_expired = $diff < 0;
                $emp->is_critical = (! $emp->is_expired && $diff <= 15);
            } else {
                $emp->days_until_expiration = null;
                $emp->is_expired = false;
                $emp->is_critical = false;
            }

            return $emp;
        });

        $stats = [
            'total_contracts' => Employee::where('status', 'Contract')->count(),
            'expiring_soon' => Employee::where('status', 'Contract')
                ->whereBetween('contract_end_date', [Carbon::now(), Carbon::now()->addDays(30)])
                ->count(),
            'expired' => Employee::where('status', 'Contract')
                ->where('contract_end_date', '<', Carbon::now()->toDateString())
                ->count(),
        ];

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'filters' => $request->only(['urgency', 'search']),
            'stats' => $stats,
        ]);
    }

    /**
     * Renew a fixed-term employment contract.
     */
    public function renew(ContractRenewalRequest $request, Employee $employee): RedirectResponse
    {
        $employee->contractRenewals()->create([
            'start_date' => $request->validated('start_date'),
            'end_date' => $request->validated('end_date'),
            'project_name' => $request->validated('project_name'),
            'agreed_salary' => $request->validated('agreed_salary'),
            'terms_summary' => $request->validated('terms_summary'),
            'status' => 'Active',
        ]);

        $employee->update([
            'contract_end_date' => $request->validated('end_date'),
            'status' => 'Contract',
        ]);

        return back()->with('success', "Contract for {$employee->full_name} ({$employee->file_no}) renewed successfully through {$request->validated('end_date')}.");
    }
}
