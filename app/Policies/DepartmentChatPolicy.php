<?php

namespace App\Policies;

use App\Models\ChatAttachment;
use App\Models\ChatChannelMetadata;
use App\Models\User;
use Musonza\Chat\Models\Conversation;
use Musonza\Chat\Models\Message;

class DepartmentChatPolicy
{
    /**
     * Determine whether the user can view the conversation.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        $employee = $user->employee;
        if (! $employee || $employee->status === 'Separated') {
            return false;
        }

        // HRAdmin and SuperAdmin have executive read access across all departments
        if (in_array($user->role, ['HRAdmin', 'SuperAdmin'])) {
            return true;
        }

        // Direct participant check
        $isParticipant = $conversation->participants()
            ->where('messageable_id', $user->id)
            ->where('messageable_type', $user->getMorphClass())
            ->exists();

        if ($isParticipant) {
            return true;
        }

        // Channel department match
        $meta = ChatChannelMetadata::where('conversation_id', $conversation->id)->first();
        if ($meta) {
            // Null department_id means all-company channel
            if ($meta->department_id === null) {
                return true;
            }

            return (int) $meta->department_id === (int) $employee->department_id;
        }

        return false;
    }

    /**
     * Determine whether the user can send messages in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        $employee = $user->employee;
        if (! $employee || $employee->status === 'Separated') {
            return false;
        }

        $meta = ChatChannelMetadata::where('conversation_id', $conversation->id)->first();
        if ($meta && $meta->is_read_only && ! in_array($user->role, ['HRAdmin', 'SuperAdmin', 'Manager'])) {
            return false;
        }

        return $this->view($user, $conversation);
    }

    /**
     * Determine whether the user can download an attachment.
     */
    public function downloadAttachment(User $user, ChatAttachment $attachment): bool
    {
        return $this->view($user, $attachment->conversation);
    }

    /**
     * Determine whether the user can pin/unpin messages.
     */
    public function pinMessage(User $user, Conversation $conversation): bool
    {
        if (in_array($user->role, ['HRAdmin', 'SuperAdmin', 'Manager'])) {
            return true;
        }

        return $this->view($user, $conversation);
    }

    /**
     * Determine whether the user can delete a message.
     */
    public function deleteMessage(User $user, Message $message): bool
    {
        if (in_array($user->role, ['HRAdmin', 'SuperAdmin'])) {
            return true;
        }

        // Message sender check
        return $message->sender && (int) $message->sender->getKey() === (int) $user->id;
    }
}
