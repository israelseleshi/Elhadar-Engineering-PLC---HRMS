<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\AnnouncementAcknowledgment;
use App\Models\AnnouncementReaction;
use App\Models\AnnouncementRead;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationCenterService;
use App\Services\SmsNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request, NotificationCenterService $notificationService): Response
    {
        $user = $request->user();
        $isHR = in_array($user->role, ['HRAdmin', 'SysAdmin'], true);

        $query = Announcement::with(['creator:id,name,role'])
            ->withCount(['reads', 'acknowledgments', 'reactions']);

        if (! $isHR) {
            $query->active()->published()->forUser($user);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('title_am', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('content_am', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        if ($status = $request->input('status')) {
            if ($isHR) {
                $query->where('status', $status);
            }
        }

        $announcements = $query->ordered()->paginate(12)->withQueryString();

        // Attach read and acknowledged status for current user
        $announcementIds = collect($announcements->items())->pluck('id')->toArray();
        $readIds = AnnouncementRead::where('user_id', $user->id)
            ->whereIn('announcement_id', $announcementIds)
            ->pluck('announcement_id')
            ->toArray();

        $acknowledgedIds = AnnouncementAcknowledgment::where('user_id', $user->id)
            ->whereIn('announcement_id', $announcementIds)
            ->pluck('announcement_id')
            ->toArray();

        $userReactions = AnnouncementReaction::where('user_id', $user->id)
            ->whereIn('announcement_id', $announcementIds)
            ->pluck('reaction', 'announcement_id')
            ->toArray();

        $announcements->through(function (Announcement $item) use ($readIds, $acknowledgedIds, $userReactions) {
            $item->is_read_by_user = in_array($item->id, $readIds, true);
            $item->is_acknowledged_by_user = in_array($item->id, $acknowledgedIds, true);
            $item->current_user_reaction = $userReactions[$item->id] ?? null;

            return $item;
        });

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search', 'category', 'priority', 'status']),
            'categories' => ['general', 'policy', 'safety', 'payroll', 'holiday', 'event'],
            'priorities' => ['standard', 'important', 'critical'],
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Announcements/Create', [
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'work_places' => Employee::whereNotNull('work_place')->distinct()->pluck('work_place')->sort()->values(),
            'roles' => ['Managerial', 'Non-Managerial'],
            'contract_types' => ['Permanent', 'Contract', 'Daily', 'Probation'],
            'employees' => User::where('is_active', true)->select('id', 'name', 'role')->orderBy('name')->get(),
        ]);
    }

    public function store(
        StoreAnnouncementRequest $request,
        SmsNotificationService $smsService
    ): RedirectResponse {
        $data = $request->validated();

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('announcements/attachments', 'public');
        }

        $announcement = Announcement::create([
            'title' => $data['title'],
            'title_am' => $data['title_am'] ?? null,
            'content' => $data['content'],
            'content_am' => $data['content_am'] ?? null,
            'priority' => $data['priority'] ?? 'standard',
            'category' => $data['category'] ?? 'general',
            'target_type' => $data['target_type'] ?? 'all',
            'target_department_ids' => $data['target_department_ids'] ?? null,
            'target_work_places' => $data['target_work_places'] ?? null,
            'target_roles' => $data['target_roles'] ?? null,
            'target_contract_types' => $data['target_contract_types'] ?? null,
            'target_user_ids' => $data['target_user_ids'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'requires_acknowledgment' => (bool) ($data['requires_acknowledgment'] ?? false),
            'allow_reactions' => (bool) ($data['allow_reactions'] ?? true),
            'send_sms' => (bool) ($data['send_sms'] ?? false),
            'status' => $data['status'] ?? 'published',
            'is_pinned' => (bool) ($data['is_pinned'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'published_at' => $data['published_at'] ?? now(),
            'expires_at' => $data['expires_at'] ?? null,
            'created_by' => auth()->id(),
        ]);

        if ($announcement->send_sms) {
            $recipients = User::where('is_active', true)->with('employee')->get();
            $smsService->dispatch($announcement, $recipients);
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_CREATE',
            'auditable_type' => Announcement::class,
            'auditable_id' => $announcement->id,
            'new_values' => $announcement->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('announcements.index')
            ->with('success', "Announcement \"{$announcement->title}\" published successfully.");
    }

    public function show(Announcement $announcement, Request $request, NotificationCenterService $service): Response
    {
        $user = $request->user();
        $service->markAsRead($announcement, $user, $request->ip(), $request->userAgent());

        $announcement->load(['creator:id,name,role']);
        $announcement->loadCount(['reads', 'acknowledgments', 'reactions']);

        $isAcknowledged = $announcement->isAcknowledgedBy($user);
        $userReaction = AnnouncementReaction::where('announcement_id', $announcement->id)
            ->where('user_id', $user->id)
            ->value('reaction');

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement,
            'is_acknowledged' => $isAcknowledged,
            'user_reaction' => $userReaction,
        ]);
    }

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'work_places' => Employee::whereNotNull('work_place')->distinct()->pluck('work_place')->sort()->values(),
            'roles' => ['Managerial', 'Non-Managerial'],
            'contract_types' => ['Permanent', 'Contract', 'Daily', 'Probation'],
            'employees' => User::where('is_active', true)->select('id', 'name', 'role')->orderBy('name')->get(),
        ]);
    }

    public function update(
        UpdateAnnouncementRequest $request,
        Announcement $announcement,
        SmsNotificationService $smsService
    ): RedirectResponse {
        $data = $request->validated();
        $oldValues = $announcement->toArray();

        $attachmentPath = $announcement->attachment_path;
        $attachmentName = $announcement->attachment_name;

        if (! empty($data['remove_attachment'])) {
            if ($attachmentPath && Storage::disk('public')->exists($attachmentPath)) {
                Storage::disk('public')->delete($attachmentPath);
            }
            $attachmentPath = null;
            $attachmentName = null;
        }

        if ($request->hasFile('attachment')) {
            if ($attachmentPath && Storage::disk('public')->exists($attachmentPath)) {
                Storage::disk('public')->delete($attachmentPath);
            }
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('announcements/attachments', 'public');
        }

        $announcement->update([
            'title' => $data['title'] ?? $announcement->title,
            'title_am' => array_key_exists('title_am', $data) ? $data['title_am'] : $announcement->title_am,
            'content' => $data['content'] ?? $announcement->content,
            'content_am' => array_key_exists('content_am', $data) ? $data['content_am'] : $announcement->content_am,
            'priority' => $data['priority'] ?? $announcement->priority,
            'category' => $data['category'] ?? $announcement->category,
            'target_type' => $data['target_type'] ?? $announcement->target_type,
            'target_department_ids' => array_key_exists('target_department_ids', $data) ? $data['target_department_ids'] : $announcement->target_department_ids,
            'target_work_places' => array_key_exists('target_work_places', $data) ? $data['target_work_places'] : $announcement->target_work_places,
            'target_roles' => array_key_exists('target_roles', $data) ? $data['target_roles'] : $announcement->target_roles,
            'target_contract_types' => array_key_exists('target_contract_types', $data) ? $data['target_contract_types'] : $announcement->target_contract_types,
            'target_user_ids' => array_key_exists('target_user_ids', $data) ? $data['target_user_ids'] : $announcement->target_user_ids,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'requires_acknowledgment' => isset($data['requires_acknowledgment']) ? (bool) $data['requires_acknowledgment'] : $announcement->requires_acknowledgment,
            'allow_reactions' => isset($data['allow_reactions']) ? (bool) $data['allow_reactions'] : $announcement->allow_reactions,
            'send_sms' => isset($data['send_sms']) ? (bool) $data['send_sms'] : $announcement->send_sms,
            'status' => $data['status'] ?? $announcement->status,
            'is_pinned' => isset($data['is_pinned']) ? (bool) $data['is_pinned'] : $announcement->is_pinned,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : $announcement->is_active,
            'published_at' => array_key_exists('published_at', $data) ? $data['published_at'] : $announcement->published_at,
            'expires_at' => array_key_exists('expires_at', $data) ? $data['expires_at'] : $announcement->expires_at,
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_UPDATE',
            'auditable_type' => Announcement::class,
            'auditable_id' => $announcement->id,
            'old_values' => $oldValues,
            'new_values' => $announcement->fresh()->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('announcements.index')
            ->with('success', "Announcement \"{$announcement->title}\" updated successfully.");
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $title = $announcement->title;

        if ($announcement->attachment_path && Storage::disk('public')->exists($announcement->attachment_path)) {
            Storage::disk('public')->delete($announcement->attachment_path);
        }

        $announcement->delete();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_DELETE',
            'auditable_type' => Announcement::class,
            'auditable_id' => $announcement->id,
            'old_values' => ['title' => $title],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('announcements.index')
            ->with('success', "Announcement \"{$title}\" deleted successfully.");
    }
}
