<?php

namespace Database\Seeders;

use App\Models\ChatChannelMetadata;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Musonza\Chat\Facades\ChatFacade as Chat;

class DepartmentChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = Department::orderBy('name')->get();

        foreach ($departments as $dept) {
            $slug = Str::slug($dept->name);

            // Check if metadata already exists
            $existing = ChatChannelMetadata::where('slug', $slug)->first();
            if ($existing) {
                $conversation = $existing->conversation;
            } else {
                // Find all active employees belonging to this department who have a linked user account
                $userIds = Employee::where('department_id', $dept->id)
                    ->where('status', '!=', 'Separated')
                    ->whereNotNull('user_id')
                    ->pluck('user_id')
                    ->toArray();

                $users = User::whereIn('id', $userIds)->get()->all();

                $conversation = Chat::createConversation(
                    $users,
                    ['department_id' => $dept->id, 'type' => 'department'],
                    $dept->name.' Team'
                );

                ChatChannelMetadata::create([
                    'conversation_id' => $conversation->id,
                    'department_id' => $dept->id,
                    'slug' => $slug,
                    'name' => $dept->name,
                    'description' => 'Official workspace and file-sharing channel for '.$dept->name.' department staff.',
                    'is_read_only' => false,
                ]);
            }
        }

        // Also create All-Company Announcements channel
        $allCompanySlug = 'all-company';
        if (! ChatChannelMetadata::where('slug', $allCompanySlug)->exists()) {
            $allActiveUserIds = Employee::where('status', '!=', 'Separated')
                ->whereNotNull('user_id')
                ->pluck('user_id')
                ->toArray();

            $allUsers = User::whereIn('id', $allActiveUserIds)->get()->all();

            $allCompanyConv = Chat::createConversation(
                $allUsers,
                ['type' => 'company_wide'],
                'Elhadar All-Staff'
            );

            ChatChannelMetadata::create([
                'conversation_id' => $allCompanyConv->id,
                'department_id' => null,
                'slug' => $allCompanySlug,
                'name' => 'Elhadar All-Staff',
                'description' => 'Company-wide open bulletin and cross-department collaboration stream.',
                'is_read_only' => false,
            ]);
        }
    }
}
