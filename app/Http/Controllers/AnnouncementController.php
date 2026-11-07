<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Announcement::with(['creator:id,name,role'])->active()->published()->ordered();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->paginate(15)->withQueryString();

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Announcements/Create');
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $announcement = Announcement::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'is_pinned' => (bool) ($data['is_pinned'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'published_at' => $data['published_at'] ?? now(),
            'expires_at' => $data['expires_at'] ?? null,
            'created_by' => auth()->id(),
        ]);

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

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $data = $request->validated();
        $oldValues = $announcement->toArray();

        $announcement->update([
            'title' => $data['title'] ?? $announcement->title,
            'content' => $data['content'] ?? $announcement->content,
            'is_pinned' => isset($data['is_pinned']) ? (bool) $data['is_pinned'] : $announcement->is_pinned,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : $announcement->is_active,
            'published_at' => isset($data['published_at']) ? $data['published_at'] : $announcement->published_at,
            'expires_at' => isset($data['expires_at']) ? $data['expires_at'] : $announcement->expires_at,
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
