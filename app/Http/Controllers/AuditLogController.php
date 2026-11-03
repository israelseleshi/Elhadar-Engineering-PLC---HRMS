<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Display the immutable security audit log and activity timeline.
     */
    public function index(Request $request): Response
    {
        $query = AuditLog::with(['user'])->latest();

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('auditable_type', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $auditLogs = $query->paginate(20)->withQueryString();

        $stats = [
            'total_events' => AuditLog::count(),
            'events_today' => AuditLog::whereDate('created_at', today())->count(),
            'unique_operators' => User::count(),
            'system_modifications' => AuditLog::where('action', 'like', '%SETTINGS%')
                ->orWhere('action', 'like', '%UPDATE%')
                ->count(),
        ];

        $distinctActions = AuditLog::select('action')->distinct()->pluck('action');

        return Inertia::render('Audit/Index', [
            'auditLogs' => $auditLogs,
            'filters' => $request->only(['action', 'search', 'date_from', 'date_to']),
            'stats' => $stats,
            'distinctActions' => $distinctActions,
        ]);
    }

    /**
     * Return detailed state diff for a specific audit entry.
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        $auditLog->load('user');

        return response()->json([
            'id' => $auditLog->id,
            'action' => $auditLog->action,
            'auditable_type' => class_basename($auditLog->auditable_type),
            'auditable_id' => $auditLog->auditable_id,
            'user' => $auditLog->user?->name ?? 'System Process',
            'ip_address' => $auditLog->ip_address,
            'user_agent' => $auditLog->user_agent,
            'created_at' => $auditLog->created_at->toIso8601String(),
            'old_values' => $auditLog->old_values,
            'new_values' => $auditLog->new_values,
        ]);
    }
}
