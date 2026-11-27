<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\AuditLog;
use App\Models\ChatChannelMetadata;
use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Musonza\Chat\Facades\ChatFacade as Chat;

class DepartmentController extends Controller
{
    /**
     * Store a newly created organizational department and provision its chat channel.
     */
    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $department = DB::transaction(function () use ($data, $request): Department {
            $created = Department::create([
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            ]);

            $this->provisionDepartmentChatChannel($created);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'DEPARTMENT_CREATE',
                'auditable_type' => Department::class,
                'auditable_id' => $created->id,
                'new_values' => $created->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $created;
        });

        return back()->with('success', "Department \"{$department->name}\" created successfully.");
    }

    /**
     * Update an existing department and keep its chat channel metadata synchronized.
     */
    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($department, $data, $request): void {
            $oldValues = $department->toArray();
            $oldName = $department->name;

            $department->update([
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $department->is_active,
            ]);

            if ($department->name !== $oldName && Schema::hasTable('chat_channel_metadata')) {
                $channelMeta = ChatChannelMetadata::where('department_id', $department->id)->first();
                if ($channelMeta) {
                    $newSlug = $this->uniqueChannelSlug($department->name, $channelMeta->id);
                    $channelMeta->update([
                        'name' => $department->name,
                        'slug' => $newSlug,
                        'description' => 'Official workspace and file-sharing channel for '.$department->name.' department staff.',
                    ]);

                    if ($channelMeta->conversation) {
                        $channelMeta->conversation->update([
                            'name' => $department->name.' Team',
                        ]);
                    }
                }
            }

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'DEPARTMENT_UPDATE',
                'auditable_type' => Department::class,
                'auditable_id' => $department->id,
                'old_values' => $oldValues,
                'new_values' => $department->fresh()->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', "Department \"{$department->name}\" updated successfully.");
    }

    /**
     * Delete an empty department (blocked if any employee records reference it).
     */
    public function destroy(Department $department): RedirectResponse
    {
        $assignedCount = Employee::withTrashed()
            ->where('department_id', $department->id)
            ->count();

        if ($assignedCount > 0) {
            return back()->withErrors([
                'department' => "Cannot delete \"{$department->name}\" because {$assignedCount} employee record(s) are assigned to it. Reassign them or mark it inactive instead.",
            ]);
        }

        $name = $department->name;
        $oldValues = $department->toArray();
        $departmentId = $department->id;

        DB::transaction(function () use ($department, $departmentId, $oldValues): void {
            if (Schema::hasTable('chat_channel_metadata')) {
                $channelMeta = ChatChannelMetadata::where('department_id', $departmentId)->first();
                if ($channelMeta) {
                    $conversation = $channelMeta->conversation;
                    $channelMeta->delete();
                    $conversation?->delete();
                }
            }

            $department->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'DEPARTMENT_DELETE',
                'auditable_type' => Department::class,
                'auditable_id' => $departmentId,
                'old_values' => $oldValues,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return back()->with('success', "Department \"{$name}\" deleted successfully.");
    }

    protected function provisionDepartmentChatChannel(Department $department): void
    {
        if (! Schema::hasTable('chat_channel_metadata') || ! Schema::hasTable('chat_conversations')) {
            return;
        }

        if (ChatChannelMetadata::where('department_id', $department->id)->exists()) {
            return;
        }

        $slug = $this->uniqueChannelSlug($department->name);
        $conversation = Chat::createConversation(
            [],
            ['department_id' => $department->id, 'type' => 'department'],
            $department->name.' Team'
        );

        ChatChannelMetadata::create([
            'conversation_id' => $conversation->id,
            'department_id' => $department->id,
            'slug' => $slug,
            'name' => $department->name,
            'description' => 'Official workspace and file-sharing channel for '.$department->name.' department staff.',
            'is_read_only' => false,
        ]);
    }

    protected function uniqueChannelSlug(string $departmentName, ?int $ignoreMetaId = null): string
    {
        $base = Str::slug($departmentName) ?: 'department';
        $slug = $base;
        $suffix = 2;

        while (
            ChatChannelMetadata::where('slug', $slug)
                ->when($ignoreMetaId, fn ($q) => $q->where('id', '!=', $ignoreMetaId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
