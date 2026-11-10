<?php

namespace App\Services;

use App\Events\ChatMessageReactionToggled;
use App\Events\ChatMessageRead;
use App\Events\ChatMessageSent;
use App\Events\ChatPinnedMessageUpdated;
use App\Models\ChatAttachment;
use App\Models\ChatChannelMetadata;
use App\Models\ChatPinnedMessage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Musonza\Chat\ConfigurationManager;
use Musonza\Chat\Facades\ChatFacade as Chat;
use Musonza\Chat\Models\Conversation;
use Musonza\Chat\Models\Message;
use Musonza\Chat\Models\MessageNotification;

class DepartmentChatService
{
    /**
     * Get all channels accessible to the user with unread counts and latest messages.
     */
    public function getAccessibleChannels(User $user): array
    {
        $employee = $user->employee;
        if (! $employee || $employee->status === 'Separated') {
            return [];
        }

        $query = ChatChannelMetadata::with(['conversation.last_message.participation.messageable', 'department']);

        // Only SysAdmin maintains global visibility for system maintenance.
        // All staff (including HRAdmin and Managers) are strictly isolated to their own department + company-wide room for privacy.
        if ($user->role !== 'SysAdmin') {
            $query->where(function ($q) use ($employee) {
                $q->where('department_id', $employee->department_id)
                    ->orWhereNull('department_id');
            });
        }

        $channels = $query->orderByRaw('department_id IS NULL DESC')->get();

        return $channels->map(function ($meta) use ($user) {
            $conv = $meta->conversation;
            if (! $conv) {
                return null;
            }

            // Unread count for current user
            $unreadCount = MessageNotification::where('conversation_id', $conv->id)
                ->where('messageable_id', $user->id)
                ->where('is_seen', 0)
                ->count();

            // Total participants count
            $memberCount = $conv->participants()->count();

            $lastMsg = $conv->last_message;
            $lastMsgData = null;
            if ($lastMsg) {
                $lastSender = $lastMsg->participation?->messageable;
                $lastMsgData = [
                    'body' => $lastMsg->body,
                    'type' => $lastMsg->type,
                    'created_at' => $lastMsg->created_at?->diffForHumans() ?? '',
                    'sender_name' => $lastSender?->name ?? 'System',
                ];
            }

            return [
                'id' => $conv->id,
                'slug' => $meta->slug,
                'name' => $meta->name,
                'description' => $meta->description,
                'department_id' => $meta->department_id,
                'department_name' => $meta->department?->name ?? 'Company-Wide',
                'is_read_only' => (bool) $meta->is_read_only,
                'is_all_company' => $meta->department_id === null,
                'member_count' => $memberCount,
                'unread_count' => $unreadCount,
                'last_message' => $lastMsgData,
            ];
        })->filter()->values()->all();
    }

    /**
     * Get paginated messages for a conversation formatted for the React frontend.
     */
    public function getConversationMessages(User $user, Conversation $conversation, int $page = 1, int $perPage = 30): array
    {
        $messagesQuery = $conversation->messages()
            ->with(['participation.messageable'])
            ->orderBy('id', 'desc');

        $paginated = $messagesQuery->paginate($perPage, ['*'], 'page', $page);
        $messageIds = $paginated->pluck('id')->all();

        // Batch load attachments
        $attachments = ChatAttachment::whereIn('message_id', $messageIds)
            ->get()
            ->groupBy('message_id');

        // Batch load reactions
        $reactions = DB::table(ConfigurationManager::REACTIONS_TABLE)
            ->whereIn('message_id', $messageIds)
            ->get()
            ->groupBy('message_id');

        // Batch load notifications for read status
        $seenNotifications = MessageNotification::whereIn('message_id', $messageIds)
            ->where('is_sender', 0)
            ->where('is_seen', 1)
            ->select('message_id', DB::raw('count(*) as seen_count'))
            ->groupBy('message_id')
            ->pluck('seen_count', 'message_id');

        // Check which messages were seen by me
        $mySeen = MessageNotification::whereIn('message_id', $messageIds)
            ->where('messageable_id', $user->id)
            ->where('is_seen', 1)
            ->pluck('message_id')
            ->flip();

        $items = $paginated->map(function ($msg) use ($user, $attachments, $reactions, $seenNotifications, $mySeen) {
            $sender = $msg->participation?->messageable;
            $senderId = $sender ? (int) $sender->id : 0;
            $isMine = $senderId === (int) $user->id;
            $seenCount = $seenNotifications[$msg->id] ?? 0;

            // Formulate Telegram-style checkmarks:
            // If mine: 'read' (double check) if at least 1 colleague saw it, else 'sent' (single check)
            $readStatus = $isMine ? ($seenCount > 0 ? 'read' : 'sent') : null;

            // Format reactions summary
            $msgReactions = $reactions->get($msg->id, collect());
            $groupedReactions = [];
            foreach ($msgReactions as $r) {
                if (! isset($groupedReactions[$r->reaction])) {
                    $groupedReactions[$r->reaction] = [
                        'emoji' => $r->reaction,
                        'count' => 0,
                        'has_reacted' => false,
                    ];
                }
                $groupedReactions[$r->reaction]['count']++;
                if ((int) $r->messageable_id === (int) $user->id) {
                    $groupedReactions[$r->reaction]['has_reacted'] = true;
                }
            }

            // Message attachments
            $msgAttachments = ($attachments->get($msg->id) ?? collect())->map(function ($att) {
                return [
                    'id' => $att->id,
                    'file_name' => $att->file_name,
                    'file_size' => $att->file_size,
                    'mime_type' => $att->mime_type,
                    'category' => $att->category,
                    'url' => route('chat.attachments.download', $att->id),
                    'thumbnail_url' => $att->thumbnail_path ? Storage::disk('public')->url($att->thumbnail_path) : null,
                ];
            });

            // Decode data payload for replies or metadata
            $msgData = is_array($msg->data) ? $msg->data : json_decode($msg->data ?? '{}', true);

            return [
                'id' => $msg->id,
                'body' => $msg->body,
                'type' => $msg->type,
                'created_at' => $msg->created_at->toISOString(),
                'created_at_formatted' => $msg->created_at->format('g:i A'),
                'created_date_formatted' => $msg->created_at->format('M d, Y'),
                'is_mine' => $isMine,
                'read_status' => $readStatus,
                'seen_count' => $seenCount,
                'is_seen_by_me' => isset($mySeen[$msg->id]),
                'sender' => [
                    'id' => $sender?->id ?? 0,
                    'name' => $sender?->name ?? 'Colleague',
                    'role' => $sender?->role ?? 'Employee',
                    'initials' => strtoupper(substr($sender?->name ?? '??', 0, 2)),
                ],
                'reply_to' => $msgData['reply_to'] ?? null,
                'attachments' => $msgAttachments->values()->all(),
                'reactions' => array_values($groupedReactions),
            ];
        })->reverse()->values()->all();

        return [
            'messages' => $items,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'has_more' => $paginated->hasMorePages(),
        ];
    }

    /**
     * Send a new message, store attachments, and broadcast real-time event.
     */
    public function sendMessage(
        User $user,
        Conversation $conversation,
        string $body,
        ?int $replyToId = null,
        array $files = []
    ): array {
        $payloadData = [];

        // If replying to another message, capture quoted snippet
        if ($replyToId) {
            $parentMsg = Message::with('participation.messageable')->find($replyToId);
            if ($parentMsg) {
                $parentSender = $parentMsg->participation?->messageable;
                $payloadData['reply_to'] = [
                    'id' => $parentMsg->id,
                    'sender_name' => $parentSender?->name ?? 'Colleague',
                    'body_preview' => mb_strimwidth($parentMsg->body, 0, 80, '...'),
                ];
            }
        }

        $type = ! empty($files) ? 'file' : 'text';

        // Send via musonza chat
        $message = Chat::message($body)
            ->from($user)
            ->to($conversation)
            ->type($type)
            ->data($payloadData)
            ->send();

        // Process attachments if any
        $savedAttachments = [];
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $savedAttachments[] = $this->storeAttachment($file, $message, $conversation, $user);
            }
        }

        // Format return payload
        $formattedMessage = [
            'id' => $message->id,
            'body' => $message->body,
            'type' => $message->type,
            'created_at' => $message->created_at->toISOString(),
            'created_at_formatted' => $message->created_at->format('g:i A'),
            'created_date_formatted' => $message->created_at->format('M d, Y'),
            'is_mine' => true,
            'read_status' => 'sent',
            'seen_count' => 0,
            'sender' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'initials' => strtoupper(substr($user->name, 0, 2)),
            ],
            'reply_to' => $payloadData['reply_to'] ?? null,
            'attachments' => $savedAttachments,
            'reactions' => [],
        ];

        // Broadcast real-time event
        broadcast(new ChatMessageSent($conversation->id, $formattedMessage))->toOthers();

        return $formattedMessage;
    }

    /**
     * Store and categorize an uploaded chat attachment.
     */
    protected function storeAttachment(UploadedFile $file, Message $message, Conversation $conversation, User $user): array
    {
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $category = 'document';
        if (str_starts_with($mime, 'image/')) {
            $category = 'media';
        } elseif (str_starts_with($mime, 'audio/')) {
            $category = 'audio';
        }

        $storedPath = $file->store("chat/{$conversation->id}", 'local');

        $attachment = ChatAttachment::create([
            'message_id' => $message->id,
            'conversation_id' => $conversation->id,
            'uploaded_by' => $user->id,
            'file_path' => $storedPath,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $mime,
            'category' => $category,
        ]);

        return [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'file_size' => $attachment->file_size,
            'mime_type' => $attachment->mime_type,
            'category' => $attachment->category,
            'url' => route('chat.attachments.download', $attachment->id),
            'thumbnail_url' => null,
        ];
    }

    /**
     * Mark all unread messages in a conversation as read for this user.
     */
    public function markAsRead(User $user, Conversation $conversation, ?int $messageId = null): void
    {
        Chat::conversation($conversation)->setParticipant($user)->readAll();

        broadcast(new ChatMessageRead(
            conversationId: $conversation->id,
            userId: $user->id,
            userName: $user->name,
            messageId: $messageId,
            readAt: now()->toISOString()
        ))->toOthers();
    }

    /**
     * Get read receipt roster showing which colleagues have read a specific message.
     */
    public function getReadReceipts(User $user, int $messageId): array
    {
        $notifications = MessageNotification::where('message_id', $messageId)
            ->where('is_sender', 0)
            ->where('is_seen', 1)
            ->with(['messageable' => function ($q) {
                $q->with('employee:id,user_id,position,department_id');
            }])
            ->get();

        return $notifications->map(function ($notif) {
            $colleague = $notif->messageable;

            return [
                'user_id' => $colleague?->id ?? 0,
                'name' => $colleague?->name ?? 'Colleague',
                'position' => $colleague?->employee?->position ?? 'Staff',
                'initials' => strtoupper(substr($colleague?->name ?? '??', 0, 2)),
                'read_at' => $notif->updated_at ? $notif->updated_at->format('g:i A, M d') : 'Recently',
            ];
        })->values()->all();
    }

    /**
     * Toggle reaction on a message.
     */
    public function toggleReaction(User $user, int $messageId, string $emoji): array
    {
        $message = Message::findOrFail($messageId);
        $conversationId = $message->conversation_id;

        $existing = DB::table(ConfigurationManager::REACTIONS_TABLE)
            ->where('message_id', $messageId)
            ->where('messageable_id', $user->id)
            ->where('reaction', $emoji)
            ->first();

        $added = false;
        if ($existing) {
            DB::table(ConfigurationManager::REACTIONS_TABLE)
                ->where('id', $existing->id)
                ->delete();
        } else {
            DB::table(ConfigurationManager::REACTIONS_TABLE)->insert([
                'message_id' => $messageId,
                'messageable_id' => $user->id,
                'messageable_type' => $user->getMorphClass(),
                'reaction' => $emoji,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $added = true;
        }

        // Fetch refreshed summary
        $summary = DB::table(ConfigurationManager::REACTIONS_TABLE)
            ->where('message_id', $messageId)
            ->select('reaction', DB::raw('count(*) as count'))
            ->groupBy('reaction')
            ->get();

        $reactionsSummary = $summary->map(fn ($s) => [
            'emoji' => $s->reaction,
            'count' => $s->count,
        ])->all();

        broadcast(new ChatMessageReactionToggled(
            conversationId: $conversationId,
            messageId: $messageId,
            userId: $user->id,
            reaction: $emoji,
            added: $added,
            reactionsSummary: $reactionsSummary
        ))->toOthers();

        return [
            'message_id' => $messageId,
            'added' => $added,
            'reactions' => $reactionsSummary,
        ];
    }

    /**
     * Toggle pinning a message in a conversation.
     */
    public function togglePin(User $user, Conversation $conversation, int $messageId): ?array
    {
        $existing = ChatPinnedMessage::where('conversation_id', $conversation->id)
            ->where('message_id', $messageId)
            ->first();

        if ($existing) {
            $existing->delete();
            $result = null;
        } else {
            // Only keep one active pinned announcement banner at a time
            ChatPinnedMessage::where('conversation_id', $conversation->id)->delete();

            $pinned = ChatPinnedMessage::create([
                'conversation_id' => $conversation->id,
                'message_id' => $messageId,
                'pinned_by' => $user->id,
                'pinned_at' => now(),
            ]);

            $msg = Message::with('participation.messageable')->find($messageId);
            $msgSender = $msg?->participation?->messageable;
            $result = [
                'id' => $pinned->id,
                'message_id' => $messageId,
                'body' => $msg?->body ?? '',
                'sender_name' => $msgSender?->name ?? 'Colleague',
                'pinned_by_name' => $user->name,
                'pinned_at' => now()->format('M d, g:i A'),
            ];
        }

        broadcast(new ChatPinnedMessageUpdated($conversation->id, $result))->toOthers();

        return $result;
    }

    /**
     * Get Telegram Vault data (Media, Files, Links, Members).
     */
    public function getVaultData(User $user, Conversation $conversation): array
    {
        // 1. Media
        $media = ChatAttachment::where('conversation_id', $conversation->id)
            ->where('category', 'media')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'file_name' => $m->file_name,
                'file_size' => $m->file_size,
                'url' => route('chat.attachments.download', $m->id),
                'created_at' => $m->created_at->format('M d, Y'),
            ]);

        // 2. Documents
        $files = ChatAttachment::where('conversation_id', $conversation->id)
            ->where('category', 'document')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'file_name' => $f->file_name,
                'file_size' => $f->file_size,
                'mime_type' => $f->mime_type,
                'url' => route('chat.attachments.download', $f->id),
                'created_at' => $f->created_at->format('M d, Y'),
            ]);

        // 3. Members roster
        $members = $conversation->participants()
            ->with(['messageable' => function ($q) {
                $q->with('employee:id,user_id,position,phone,department_id');
            }])
            ->get()
            ->map(function ($p) {
                $u = $p->messageable;

                return [
                    'id' => $u?->id ?? 0,
                    'name' => $u?->name ?? 'Colleague',
                    'role' => $u?->role ?? 'Employee',
                    'position' => $u?->employee?->position ?? 'Staff Member',
                    'phone' => $u?->phone ?? '—',
                    'initials' => strtoupper(substr($u?->name ?? '??', 0, 2)),
                ];
            });

        // 4. Current pinned message
        $pinned = ChatPinnedMessage::where('conversation_id', $conversation->id)
            ->with(['message.participation.messageable', 'pinner'])
            ->first();

        $pinnedData = null;
        if ($pinned && $pinned->message) {
            $pinnedSender = $pinned->message->participation?->messageable;
            $pinnedData = [
                'id' => $pinned->id,
                'message_id' => $pinned->message_id,
                'body' => $pinned->message->body,
                'sender_name' => $pinnedSender?->name ?? 'Colleague',
                'pinned_by_name' => $pinned->pinner?->name ?? 'HR',
                'pinned_at' => $pinned->pinned_at?->format('M d, g:i A') ?? '',
            ];
        }

        return [
            'media' => $media,
            'files' => $files,
            'members' => $members,
            'pinned' => $pinnedData,
        ];
    }
}
