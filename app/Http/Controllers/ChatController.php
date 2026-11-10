<?php

namespace App\Http\Controllers;

use App\Models\ChatAttachment;
use App\Models\User;
use App\Services\DepartmentChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Musonza\Chat\Models\Conversation;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(
        protected DepartmentChatService $chatService
    ) {}

    /**
     * Render the main Department Chat workspace.
     */
    public function index(Request $request, ?int $conversationId = null): Response
    {
        $user = $request->user();
        $channels = $this->chatService->getAccessibleChannels($user);
        $directConversations = $this->chatService->getDirectConversations($user);

        if (empty($channels) && empty($directConversations)) {
            abort(403, 'Your account is not assigned to an active department channel.');
        }

        // Determine active conversation
        $activeChannel = null;
        if ($conversationId) {
            $activeChannel = collect($channels)->firstWhere('id', (int) $conversationId)
                ?? collect($directConversations)->firstWhere('id', (int) $conversationId);

            if (! $activeChannel) {
                $requestedConversation = Conversation::findOrFail($conversationId);
                Gate::authorize('view', $requestedConversation);

                if ($requestedConversation->direct_message) {
                    $activeChannel = $this->chatService->formatDirectConversation($user, $requestedConversation);
                }
            }
        }

        if (! $activeChannel) {
            $activeChannel = ! empty($channels) ? $channels[0] : $directConversations[0];
        }

        $activeConversation = Conversation::findOrFail($activeChannel['id']);
        Gate::authorize('view', $activeConversation);

        // Fetch initial messages and vault data
        $messagesData = $this->chatService->getConversationMessages($user, $activeConversation, page: 1, perPage: 40);
        $vaultData = $this->chatService->getVaultData($user, $activeConversation);

        // Mark as read on entry
        $this->chatService->markAsRead($user, $activeConversation);

        return Inertia::render('Chat/DepartmentChat', [
            'channels' => $channels,
            'directConversations' => $directConversations,
            'activeChannel' => $activeChannel,
            'initialMessages' => $messagesData['messages'],
            'hasMoreMessages' => $messagesData['has_more'],
            'vaultData' => $vaultData,
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'department_id' => $user->employee?->department_id,
                'position' => $user->employee?->position ?? 'Staff',
                'initials' => strtoupper(substr($user->name, 0, 2)),
                'profile_photo_url' => $user->profile_photo_url,
            ],
        ]);
    }

    /**
     * Get paginated messages for infinite scrolling.
     */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $page = (int) $request->input('page', 1);
        $data = $this->chatService->getConversationMessages($request->user(), $conversation, page: $page, perPage: 40);

        return response()->json($data);
    }

    /**
     * Send a new message with optional attachments and reply quote.
     */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('sendMessage', $conversation);

        $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'reply_to_id' => ['nullable', 'integer'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'max:25600'], // 25 MB max per file
        ]);

        $body = (string) $request->input('body', '');
        $files = $request->file('files', []);

        if (empty(trim($body)) && empty($files)) {
            return response()->json(['message' => 'Message body or file attachment is required.'], 422);
        }

        $replyToId = $request->input('reply_to_id') ? (int) $request->input('reply_to_id') : null;

        $sentMessage = $this->chatService->sendMessage(
            user: $request->user(),
            conversation: $conversation,
            body: $body,
            replyToId: $replyToId,
            files: $files
        );

        return response()->json([
            'success' => true,
            'message' => $sentMessage,
        ], 201);
    }

    /**
     * Mark conversation messages as read.
     */
    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $messageId = $request->input('message_id') ? (int) $request->input('message_id') : null;
        $this->chatService->markAsRead($request->user(), $conversation, $messageId);

        return response()->json(['success' => true]);
    }

    /**
     * Get Telegram-style read receipts roster for a specific message.
     */
    public function receipts(Request $request, int $messageId): JsonResponse
    {
        $receipts = $this->chatService->getReadReceipts($request->user(), $messageId);

        return response()->json([
            'message_id' => $messageId,
            'readers' => $receipts,
        ]);
    }

    /**
     * Toggle reaction on a message.
     */
    public function react(Request $request, int $messageId): JsonResponse
    {
        $request->validate([
            'emoji' => ['required', 'string', 'max:32'],
        ]);

        $res = $this->chatService->toggleReaction($request->user(), $messageId, $request->input('emoji'));

        return response()->json($res);
    }

    /**
     * Pin or unpin a message.
     */
    public function pin(Request $request, Conversation $conversation, int $messageId): JsonResponse
    {
        Gate::authorize('pinMessage', $conversation);

        $pinned = $this->chatService->togglePin($request->user(), $conversation, $messageId);

        return response()->json([
            'success' => true,
            'pinned' => $pinned,
        ]);
    }

    /**
     * Fetch updated Telegram Vault data (media, files, links, members).
     */
    public function vault(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $data = $this->chatService->getVaultData($request->user(), $conversation);

        return response()->json($data);
    }

    /**
     * Search colleagues across the company for 1-to-1 chat initiation.
     */
    public function searchColleagues(Request $request): JsonResponse
    {
        $query = (string) $request->input('search', '');
        $colleagues = $this->chatService->searchColleagues($request->user(), $query);

        return response()->json(['colleagues' => $colleagues]);
    }

    /**
     * Initiate or continue a 1-to-1 direct conversation with a colleague and send the message.
     */
    public function startDirect(Request $request, User $targetUser): JsonResponse
    {
        $user = $request->user();

        if ((int) $user->id === (int) $targetUser->id) {
            return response()->json(['message' => 'You cannot initiate a direct conversation with yourself.'], 422);
        }

        if ($targetUser->employee?->status === 'Separated') {
            return response()->json(['message' => 'This employee is no longer with the organization.'], 403);
        }

        $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'reply_to_id' => ['nullable', 'integer'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'max:25600'],
        ]);

        $body = (string) $request->input('body', '');
        $files = $request->file('files', []);

        if (empty(trim($body)) && empty($files)) {
            return response()->json(['message' => 'Message body or file attachment is required.'], 422);
        }

        $replyToId = $request->input('reply_to_id') ? (int) $request->input('reply_to_id') : null;

        $result = $this->chatService->startDirectConversation(
            user: $user,
            targetUser: $targetUser,
            body: $body,
            replyToId: $replyToId,
            files: $files
        );

        return response()->json([
            'success' => true,
            'conversation' => $result['conversation'],
            'message' => $result['message'],
        ], 201);
    }

    /**
     * Securely download or stream an attachment with department authorization.
     */
    public function downloadAttachment(Request $request, ChatAttachment $attachment): StreamedResponse
    {
        Gate::authorize('downloadAttachment', $attachment);

        if (! Storage::disk('local')->exists($attachment->file_path)) {
            abort(404, 'The requested file could not be found.');
        }

        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name, [
            'Content-Type' => $attachment->mime_type,
        ]);
    }
}
