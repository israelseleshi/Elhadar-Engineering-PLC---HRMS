<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\AnnouncementAcknowledgment;
use App\Models\AnnouncementReaction;
use App\Models\AnnouncementRead;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationCenterService
{
    /**
     * Get unread notifications count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return Announcement::query()
            ->active()
            ->published()
            ->forUser($user)
            ->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->count();
    }

    /**
     * Get targeted notification feed for a user.
     */
    public function getFeed(User $user, int $limit = 15): array
    {
        $announcements = Announcement::query()
            ->with(['creator:id,name,role'])
            ->withCount(['reads', 'acknowledgments', 'reactions'])
            ->active()
            ->published()
            ->forUser($user)
            ->ordered()
            ->limit($limit)
            ->get();

        $unreadCount = $this->getUnreadCount($user);

        // Fetch user read and acknowledgment IDs in batch for high performance
        $announcementIds = $announcements->pluck('id')->toArray();

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

        // Reactions count grouped by reaction type
        $reactionsGrouped = DB::table('announcement_reactions')
            ->select('announcement_id', 'reaction', DB::raw('count(*) as count'))
            ->whereIn('announcement_id', $announcementIds)
            ->groupBy('announcement_id', 'reaction')
            ->get()
            ->groupBy('announcement_id');

        $formatted = $announcements->map(function (Announcement $announcement) use (
            $readIds,
            $acknowledgedIds,
            $userReactions,
            $reactionsGrouped
        ) {
            $reactionsMap = [
                'clap' => 0,
                'party' => 0,
                'heart' => 0,
                'thumbs_up' => 0,
                'verified' => 0,
            ];

            if (isset($reactionsGrouped[$announcement->id])) {
                foreach ($reactionsGrouped[$announcement->id] as $row) {
                    $reactionsMap[$row->reaction] = (int) $row->count;
                }
            }

            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'title_am' => $announcement->title_am,
                'content' => $announcement->content,
                'content_am' => $announcement->content_am,
                'priority' => $announcement->priority,
                'category' => $announcement->category,
                'is_pinned' => $announcement->is_pinned,
                'requires_acknowledgment' => $announcement->requires_acknowledgment,
                'allow_reactions' => $announcement->allow_reactions,
                'attachment_url' => $announcement->attachment_url,
                'attachment_name' => $announcement->attachment_name,
                'published_at' => $announcement->published_at?->toIso8601String(),
                'expires_at' => $announcement->expires_at?->toIso8601String(),
                'created_at' => $announcement->created_at->toIso8601String(),
                'is_read' => in_array($announcement->id, $readIds, true),
                'is_acknowledged' => in_array($announcement->id, $acknowledgedIds, true),
                'user_reaction' => $userReactions[$announcement->id] ?? null,
                'reactions' => $reactionsMap,
                'total_reactions' => (int) $announcement->reactions_count,
                'creator' => $announcement->creator ? [
                    'id' => $announcement->creator->id,
                    'name' => $announcement->creator->name,
                    'role' => $announcement->creator->role,
                ] : null,
            ];
        });

        return [
            'unread_count' => $unreadCount,
            'notifications' => $formatted,
        ];
    }

    /**
     * Mark an announcement as read by a user.
     */
    public function markAsRead(Announcement $announcement, User $user, ?string $ip = null, ?string $userAgent = null): void
    {
        AnnouncementRead::firstOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
            ],
            [
                'read_at' => now(),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]
        );
    }

    /**
     * Mark all active published announcements for a user as read.
     */
    public function markAllAsRead(User $user, ?string $ip = null, ?string $userAgent = null): void
    {
        $announcements = Announcement::query()
            ->active()
            ->published()
            ->forUser($user)
            ->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->pluck('id');

        $now = now();
        $records = $announcements->map(fn ($id) => [
            'announcement_id' => $id,
            'user_id' => $user->id,
            'read_at' => $now,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        if (! empty($records)) {
            AnnouncementRead::insertOrIgnore($records);
        }
    }

    /**
     * Record employee formal acknowledgment (e-signature).
     */
    public function recordAcknowledgment(Announcement $announcement, User $user, ?string $ip = null, ?string $userAgent = null): void
    {
        AnnouncementAcknowledgment::firstOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
            ],
            [
                'acknowledged_at' => now(),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]
        );

        // Also mark as read automatically
        $this->markAsRead($announcement, $user, $ip, $userAgent);
    }

    /**
     * Toggle an emoji reaction on an announcement.
     */
    public function toggleReaction(Announcement $announcement, User $user, string $reaction): array
    {
        $validReactions = ['clap', 'party', 'heart', 'thumbs_up', 'verified'];
        if (! in_array($reaction, $validReactions, true)) {
            $reaction = 'thumbs_up';
        }

        $existing = AnnouncementReaction::where('announcement_id', $announcement->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->reaction === $reaction) {
            $existing->delete();
            $currentReaction = null;
        } elseif ($existing) {
            $existing->update(['reaction' => $reaction]);
            $currentReaction = $reaction;
        } else {
            AnnouncementReaction::create([
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
                'reaction' => $reaction,
            ]);
            $currentReaction = $reaction;
        }

        $counts = DB::table('announcement_reactions')
            ->select('reaction', DB::raw('count(*) as count'))
            ->where('announcement_id', $announcement->id)
            ->groupBy('reaction')
            ->pluck('count', 'reaction')
            ->toArray();

        return [
            'user_reaction' => $currentReaction,
            'reactions' => [
                'clap' => (int) ($counts['clap'] ?? 0),
                'party' => (int) ($counts['party'] ?? 0),
                'heart' => (int) ($counts['heart'] ?? 0),
                'thumbs_up' => (int) ($counts['thumbs_up'] ?? 0),
                'verified' => (int) ($counts['verified'] ?? 0),
            ],
        ];
    }

    /**
     * Get detailed read receipts and acknowledgment analytics for HR Admin.
     */
    public function getAnalytics(Announcement $announcement): array
    {
        // 1. Resolve targeted users
        $query = User::query()->where('is_active', true)->with(['employee.department']);

        if ($announcement->target_type === 'custom' && ! empty($announcement->target_user_ids)) {
            $query->whereIn('id', $announcement->target_user_ids);
        } elseif ($announcement->target_type === 'departments' && ! empty($announcement->target_department_ids)) {
            $query->whereHas('employee', function ($q) use ($announcement) {
                $q->whereIn('department_id', $announcement->target_department_ids);
            });
        } elseif ($announcement->target_type === 'work_places' && ! empty($announcement->target_work_places)) {
            $query->whereHas('employee', function ($q) use ($announcement) {
                $q->whereIn('work_place', $announcement->target_work_places);
            });
        } elseif ($announcement->target_type === 'roles' && ! empty($announcement->target_roles)) {
            $query->whereHas('employee', function ($q) use ($announcement) {
                $q->whereIn('employment_type', $announcement->target_roles);
            });
        } elseif ($announcement->target_type === 'contract_types' && ! empty($announcement->target_contract_types)) {
            $query->whereHas('employee', function ($q) use ($announcement) {
                $q->whereIn('contract_type', $announcement->target_contract_types);
            });
        }

        $targetedUsers = $query->get();
        $targetedCount = $targetedUsers->count();

        // 2. Fetch all reads and acknowledgments for this announcement
        $reads = AnnouncementRead::where('announcement_id', $announcement->id)
            ->get()
            ->keyBy('user_id');

        $acknowledgments = AnnouncementAcknowledgment::where('announcement_id', $announcement->id)
            ->get()
            ->keyBy('user_id');

        $staffList = $targetedUsers->map(function (User $u) use ($reads, $acknowledgments) {
            $read = $reads->get($u->id);
            $ack = $acknowledgments->get($u->id);

            return [
                'user_id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'department' => $u->employee?->department?->name ?? 'General',
                'work_place' => $u->employee?->work_place ?? 'Head Office',
                'position' => $u->employee?->position ?? 'Staff',
                'is_read' => $read !== null,
                'read_at' => $read?->read_at?->format('M d, Y h:i A'),
                'is_acknowledged' => $ack !== null,
                'acknowledged_at' => $ack?->acknowledged_at?->format('M d, Y h:i A'),
            ];
        });

        $readCount = $reads->count();
        $ackCount = $acknowledgments->count();

        return [
            'total_targeted' => $targetedCount,
            'total_reads' => $readCount,
            'read_percentage' => $targetedCount > 0 ? round(($readCount / $targetedCount) * 100, 1) : 0,
            'total_acknowledgments' => $ackCount,
            'acknowledgment_percentage' => $targetedCount > 0 ? round(($ackCount / $targetedCount) * 100, 1) : 0,
            'requires_acknowledgment' => $announcement->requires_acknowledgment,
            'staff' => $staffList,
        ];
    }
}
