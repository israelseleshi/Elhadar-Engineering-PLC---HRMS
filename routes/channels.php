<?php

use App\Models\ChatChannelMetadata;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Musonza\Chat\Models\Conversation;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel for department rooms (online list, typing indicators)
Broadcast::channel('presence.department.{departmentId}', function (User $user, $departmentId) {
    $employee = $user->employee;
    if (! $employee || $employee->status === 'Separated') {
        return false;
    }

    // SysAdmin technical maintenance override
    if ($user->role === 'SysAdmin') {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'position' => $employee->position,
            'avatar_initials' => strtoupper(substr($user->name, 0, 2)),
        ];
    }

    if ((int) $employee->department_id === (int) $departmentId) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'position' => $employee->position,
            'avatar_initials' => strtoupper(substr($user->name, 0, 2)),
        ];
    }

    return false;
});

// Private channel for specific conversation messages and read sync
Broadcast::channel('chat.conversation.{conversationId}', function (User $user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (! $conversation) {
        return false;
    }

    $employee = $user->employee;
    if (! $employee || $employee->status === 'Separated') {
        return false;
    }

    if ($user->role === 'SysAdmin') {
        return true;
    }

    // Check if participant
    $isParticipant = $conversation->participants()
        ->where('messageable_id', $user->id)
        ->where('messageable_type', $user->getMorphClass())
        ->exists();

    if ($isParticipant) {
        return true;
    }

    // Check department metadata
    $meta = ChatChannelMetadata::where('conversation_id', $conversationId)->first();
    if ($meta) {
        if ($meta->department_id === null) {
            return true; // All-company channel
        }

        return (int) $meta->department_id === (int) $employee->department_id;
    }

    return false;
});
