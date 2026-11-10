<?php

namespace App\Observers;

use App\Models\ChatChannelMetadata;
use App\Models\Employee;
use App\Models\User;

class EmployeeObserver
{
    /**
     * Handle the Employee "created" event.
     */
    public function created(Employee $employee): void
    {
        $this->syncDepartmentChat($employee);
    }

    /**
     * Handle the Employee "updated" event.
     */
    public function updated(Employee $employee): void
    {
        if ($employee->isDirty('department_id') || $employee->isDirty('status') || $employee->isDirty('user_id')) {
            $this->syncDepartmentChat($employee, $employee->getOriginal('department_id'));
        }
    }

    /**
     * Handle the Employee "deleted" event.
     */
    public function deleted(Employee $employee): void
    {
        if ($employee->user) {
            $this->removeUserFromAllDepartmentChats($employee->user);
        }
    }

    protected function syncDepartmentChat(Employee $employee, ?int $oldDepartmentId = null): void
    {
        $user = $employee->user ?: ($employee->user_id ? User::find($employee->user_id) : null);
        if (! $user) {
            return;
        }

        // If employee is marked Separated, remove from all department channels
        if ($employee->status === 'Separated') {
            $this->removeUserFromAllDepartmentChats($user);

            return;
        }

        // If department changed, remove from old department channel
        if ($oldDepartmentId && $oldDepartmentId !== $employee->department_id) {
            $oldMeta = ChatChannelMetadata::where('department_id', $oldDepartmentId)->first();
            if ($oldMeta && $oldMeta->conversation) {
                $oldMeta->conversation->removeParticipant([$user]);
            }
        }

        // Add to new department channel
        if ($employee->department_id) {
            $newMeta = ChatChannelMetadata::where('department_id', $employee->department_id)->first();
            if ($newMeta && $newMeta->conversation) {
                $isParticipant = $newMeta->conversation->participants()
                    ->where('messageable_id', $user->id)
                    ->where('messageable_type', $user->getMorphClass())
                    ->exists();

                if (! $isParticipant) {
                    $newMeta->conversation->addParticipants([$user]);
                }
            }
        }

        // Ensure user is in All-Staff channel
        $allStaffMeta = ChatChannelMetadata::where('slug', 'all-company')->first();
        if ($allStaffMeta && $allStaffMeta->conversation) {
            $isParticipant = $allStaffMeta->conversation->participants()
                ->where('messageable_id', $user->id)
                ->where('messageable_type', $user->getMorphClass())
                ->exists();

            if (! $isParticipant) {
                $allStaffMeta->conversation->addParticipants([$user]);
            }
        }
    }

    protected function removeUserFromAllDepartmentChats(User $user): void
    {
        $channels = ChatChannelMetadata::with('conversation')->get();
        foreach ($channels as $channel) {
            if ($channel->conversation) {
                $channel->conversation->removeParticipant([$user]);
            }
        }
    }
}
