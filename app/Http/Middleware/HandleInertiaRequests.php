<?php

namespace App\Http\Middleware;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle the incoming request.
     *
     * @param  \Closure(Request): (Response)  $next
     */
    public function handle(Request $request, \Closure $next)
    {
        $response = parent::handle($request, $next);

        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $pendingApprovalsCount = 0;

        if ($user) {
            if (! $user->relationLoaded('employee')) {
                $user->load(['employee:id,user_id,phone,position,department_id,full_name,status', 'employee.department:id,name']);
            }

            if ($user->canApproveLeave()) {
                $scope = $user->getManagerialScope();
                $pendingQuery = LeaveRequest::where('status', 'Pending');
                if ($user->employee) {
                    $pendingQuery->where('employee_id', '!=', $user->employee->id);
                }
                if ($scope === 'department' && $user->employee?->department_id) {
                    $deptId = $user->employee->department_id;
                    $pendingQuery->whereHas('employee', fn ($q) => $q->where('department_id', $deptId));
                }
                $pendingApprovalsCount = $pendingQuery->count();
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'pending_leave_approvals_count' => $pendingApprovalsCount,
                    'managerial_level' => $user->employee?->getManagerialLevel(),
                    'managerial_scope' => $user->getManagerialScope(),
                ]) : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
