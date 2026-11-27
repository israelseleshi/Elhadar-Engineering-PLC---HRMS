<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkplaceRequest;
use App\Http\Requests\UpdateWorkplaceRequest;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Workplace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class WorkplaceController extends Controller
{
    /**
     * Store a newly created workplace or project site.
     */
    public function store(StoreWorkplaceRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $workplace = DB::transaction(function () use ($data, $request): Workplace {
            $created = Workplace::create([
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'type' => $data['type'],
                'location' => $data['location'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            ]);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'WORKPLACE_CREATE',
                'auditable_type' => Workplace::class,
                'auditable_id' => $created->id,
                'new_values' => $created->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $created;
        });

        return back()->with('success', "Workplace \"{$workplace->name}\" added successfully.");
    }

    /**
     * Update an existing workplace and cascade any name change to assigned employees.
     */
    public function update(UpdateWorkplaceRequest $request, Workplace $workplace): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($workplace, $data, $request): void {
            $oldValues = $workplace->toArray();
            $oldName = $workplace->name;

            $workplace->update([
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'type' => $data['type'],
                'location' => $data['location'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $workplace->is_active,
            ]);

            if ($workplace->name !== $oldName) {
                Employee::withTrashed()
                    ->where('work_place', $oldName)
                    ->update(['work_place' => $workplace->name]);

                Announcement::where('target_type', 'work_places')
                    ->whereNotNull('target_work_places')
                    ->get()
                    ->each(function (Announcement $announcement) use ($oldName, $workplace): void {
                        $targets = $announcement->target_work_places ?? [];
                        if (in_array($oldName, $targets, true)) {
                            $updated = array_values(array_unique(array_map(
                                fn (string $wp): string => $wp === $oldName ? $workplace->name : $wp,
                                $targets
                            )));
                            $announcement->update(['target_work_places' => $updated]);
                        }
                    });
            }

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'WORKPLACE_UPDATE',
                'auditable_type' => Workplace::class,
                'auditable_id' => $workplace->id,
                'old_values' => $oldValues,
                'new_values' => $workplace->fresh()->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', "Workplace \"{$workplace->name}\" updated successfully.");
    }

    /**
     * Remove an unused workplace from the registry.
     */
    public function destroy(Workplace $workplace): RedirectResponse
    {
        $assignedCount = Employee::withTrashed()
            ->where('work_place', $workplace->name)
            ->count();

        if ($assignedCount > 0) {
            return back()->withErrors([
                'workplace' => "Cannot delete \"{$workplace->name}\" because {$assignedCount} employee record(s) are assigned to it. Reassign them or mark it inactive instead.",
            ]);
        }

        $name = $workplace->name;
        $oldValues = $workplace->toArray();
        $workplaceId = $workplace->id;

        DB::transaction(function () use ($workplace, $workplaceId, $oldValues): void {
            $workplace->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'WORKPLACE_DELETE',
                'auditable_type' => Workplace::class,
                'auditable_id' => $workplaceId,
                'old_values' => $oldValues,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return back()->with('success', "Workplace \"{$name}\" deleted successfully.");
    }
}
