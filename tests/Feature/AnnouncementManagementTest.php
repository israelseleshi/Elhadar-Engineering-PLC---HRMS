<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_authenticated_users_can_view_announcements_index(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);

        $response = $this->actingAs($user)->get(route('announcements.index'));

        $response->assertOk();
    }

    public function test_hr_admin_can_access_announcements_create_page_without_404(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);

        $response = $this->actingAs($hrAdmin)->get(route('announcements.create'));

        $response->assertOk();
    }

    public function test_sys_admin_can_access_announcements_create_page(): void
    {
        $sysAdmin = User::factory()->create(['role' => 'SysAdmin']);

        $response = $this->actingAs($sysAdmin)->get(route('announcements.create'));

        $response->assertOk();
    }

    public function test_employee_is_forbidden_or_redirected_from_announcements_create_page(): void
    {
        $employee = User::factory()->create(['role' => 'Employee']);

        $response = $this->actingAs($employee)->get(route('announcements.create'));

        // Non-administrative users are redirected to portal
        $response->assertRedirect('/portal/profile');
    }

    public function test_hr_admin_can_store_new_announcement(): void
    {
        $hrAdmin = User::factory()->create(['role' => 'HRAdmin']);

        $payload = [
            'title' => 'Q4 Safety & Engineering Protocols',
            'title_am' => 'የ4ኛ ሩብ ዓመት ደህንነት መመሪያ',
            'content' => 'All site engineers must review the revised safety checklists immediately.',
            'content_am' => 'ሁሉም የሳይት መሐንዲሶች የተሻሻለውን የደህንነት መመሪያ መከተል አለባቸው።',
            'priority' => 'critical',
            'category' => 'safety',
            'target_type' => 'all',
            'requires_acknowledgment' => true,
            'allow_reactions' => true,
            'status' => 'published',
        ];

        $response = $this->actingAs($hrAdmin)->post(route('announcements.store'), $payload);

        $response->assertRedirect(route('announcements.index'));
        $this->assertDatabaseHas('announcements', [
            'title' => 'Q4 Safety & Engineering Protocols',
            'priority' => 'critical',
            'category' => 'safety',
            'requires_acknowledgment' => true,
        ]);
    }

    public function test_user_can_view_announcement_details_by_numeric_id(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $announcement = Announcement::factory()->create([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('announcements.show', $announcement->id));

        $response->assertOk();
        $this->assertDatabaseHas('announcement_reads', [
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_acknowledge_compliance_announcement(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $announcement = Announcement::factory()->create([
            'status' => 'published',
            'requires_acknowledgment' => true,
            'published_at' => now(),
        ]);

        $response = $this->actingAs($user)->post(route('announcements.acknowledge', $announcement->id));

        $response->assertOk();
        $this->assertDatabaseHas('announcement_acknowledgments', [
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_react_to_announcement(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $announcement = Announcement::factory()->create([
            'status' => 'published',
            'allow_reactions' => true,
            'published_at' => now(),
        ]);

        $response = $this->actingAs($user)->post(route('announcements.react', $announcement->id), [
            'reaction' => 'thumbs_up',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('announcement_reactions', [
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
            'reaction' => 'thumbs_up',
        ]);
    }
}
