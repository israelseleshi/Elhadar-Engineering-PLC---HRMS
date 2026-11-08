<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\UserPushSubscription;
use App\Services\NotificationCenterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function feed(Request $request, NotificationCenterService $service): JsonResponse
    {
        return response()->json($service->getFeed($request->user()));
    }

    public function unreadCount(Request $request, NotificationCenterService $service): JsonResponse
    {
        return response()->json([
            'unread_count' => $service->getUnreadCount($request->user()),
        ]);
    }

    public function markRead(Request $request, Announcement $announcement, NotificationCenterService $service): JsonResponse
    {
        $service->markAsRead($announcement, $request->user(), $request->ip(), $request->userAgent());

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request, NotificationCenterService $service): JsonResponse
    {
        $service->markAllAsRead($request->user(), $request->ip(), $request->userAgent());

        return response()->json(['success' => true]);
    }

    public function acknowledge(Request $request, Announcement $announcement, NotificationCenterService $service): JsonResponse
    {
        $service->recordAcknowledgment($announcement, $request->user(), $request->ip(), $request->userAgent());

        return response()->json([
            'success' => true,
            'message' => 'Circular acknowledgment recorded successfully.',
        ]);
    }

    public function react(Request $request, Announcement $announcement, NotificationCenterService $service): JsonResponse
    {
        $reaction = $request->input('reaction', 'thumbs_up');
        $result = $service->toggleReaction($announcement, $request->user(), $reaction);

        return response()->json($result);
    }

    public function analytics(Request $request, Announcement $announcement, NotificationCenterService $service): JsonResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            abort(403, 'Unauthorized access to compliance analytics.');
        }

        return response()->json($service->getAnalytics($announcement));
    }

    public function subscribePush(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => ['required', 'string'],
            'public_key' => ['nullable', 'string'],
            'auth_token' => ['nullable', 'string'],
        ]);

        UserPushSubscription::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'endpoint' => $request->input('endpoint'),
            ],
            [
                'public_key' => $request->input('public_key'),
                'auth_token' => $request->input('auth_token'),
            ]
        );

        return response()->json(['success' => true]);
    }
}
