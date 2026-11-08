<?php

namespace App\Services;

use App\Models\Announcement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SmsNotificationService
{
    /**
     * Dispatch SMS notifications for an announcement.
     * Currently runs in Safe Log / Mock Driver mode until SMS provider credentials are provided.
     */
    public function dispatch(Announcement $announcement, Collection $recipients): array
    {
        $message = "El-Hadar HRMS: {$announcement->title}. View circular: ".url("/announcements/{$announcement->id}");

        $dispatchedCount = 0;
        $loggedNumbers = [];

        foreach ($recipients as $user) {
            $phone = $user->employee?->phone;
            if ($phone) {
                $dispatchedCount++;
                $loggedNumbers[] = $phone;
            }
        }

        // Log the dispatch event safely
        Log::channel('single')->info("SMS Notification Simulation dispatched for Announcement #{$announcement->id}", [
            'title' => $announcement->title,
            'recipients_count' => $dispatchedCount,
            'message' => $message,
            'driver' => 'mock_log',
        ]);

        return [
            'status' => 'simulated',
            'driver' => 'mock_log',
            'recipients_count' => $dispatchedCount,
            'message' => $message,
            'note' => 'SMS Gateway is currently operating in Safe Log mode. No cellular carrier charges incurred.',
        ];
    }
}
