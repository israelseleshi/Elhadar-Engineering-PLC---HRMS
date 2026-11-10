<?php

namespace Tests\Feature;

use App\Models\ChatChannelMetadata;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Database\Seeders\DepartmentChatSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure sample departments exist
        Department::firstOrCreate(['name' => 'Construction & Engineering']);
        Department::firstOrCreate(['name' => 'Finance Dept']);
        Department::firstOrCreate(['name' => 'P&ED']);

        // Seed chat channels
        $this->seed(DepartmentChatSeeder::class);
    }

    public function test_active_employee_can_access_chat_index(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $response = $this->actingAs($user->fresh())->get(route('chat.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Chat/DepartmentChat')
            ->has('channels')
            ->has('activeChannel')
        );
    }

    public function test_employee_cannot_access_other_department_conversation(): void
    {
        $dept1 = Department::first();
        $dept2 = Department::skip(1)->first();

        $user1 = User::factory()->create(['role' => 'Employee']);
        $employee1 = Employee::factory()->create([
            'user_id' => $user1->id,
            'department_id' => $dept1->id,
            'status' => 'Permanent',
        ]);

        $channel2 = ChatChannelMetadata::where('department_id', $dept2->id)->firstOrFail();

        $response = $this->actingAs($user1->fresh())->get(route('chat.show', $channel2->conversation_id));

        $response->assertStatus(403);
    }

    public function test_hr_admin_cannot_access_other_department_conversation_for_privacy(): void
    {
        $dept1 = Department::first();
        $dept2 = Department::skip(1)->first();

        // HRAdmin user in dept1
        $hrUser = User::factory()->create(['role' => 'HRAdmin']);
        $hrEmployee = Employee::factory()->create([
            'user_id' => $hrUser->id,
            'department_id' => $dept1->id,
            'status' => 'Permanent',
        ]);

        $channel2 = ChatChannelMetadata::where('department_id', $dept2->id)->firstOrFail();

        // Attempt to view dept2 conversation should be rejected with 403 Forbidden
        $response = $this->actingAs($hrUser->fresh())->get(route('chat.show', $channel2->conversation_id));

        $response->assertStatus(403);
    }

    public function test_hr_admin_only_sees_own_department_and_company_wide_channels(): void
    {
        $dept1 = Department::first();

        // HRAdmin user in dept1
        $hrUser = User::factory()->create(['role' => 'HRAdmin']);
        Employee::factory()->create([
            'user_id' => $hrUser->id,
            'department_id' => $dept1->id,
            'status' => 'Permanent',
        ]);

        $response = $this->actingAs($hrUser->fresh())->get(route('chat.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Chat/DepartmentChat')
            ->has('channels', 2) // Dept1 + All-Company channel only
        );
    }

    public function test_separated_employee_is_denied_access_to_chat(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Separated',
        ]);

        $response = $this->actingAs($user->fresh())->get(route('chat.index'));

        $response->assertStatus(403);
    }

    public function test_employee_can_send_message_in_department_conversation(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $channel = ChatChannelMetadata::where('department_id', $dept->id)->firstOrFail();

        $response = $this->actingAs($user->fresh())->postJson(route('chat.send', $channel->conversation_id), [
            'body' => 'Hello department team!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('message.body', 'Hello department team!');
    }

    public function test_employee_can_toggle_reaction_on_message(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $channel = ChatChannelMetadata::where('department_id', $dept->id)->firstOrFail();

        // Send a message
        $sendResponse = $this->actingAs($user->fresh())->postJson(route('chat.send', $channel->conversation_id), [
            'body' => 'Testing reaction message',
        ]);
        $messageId = $sendResponse->json('message.id');

        // Toggle reaction
        $reactResponse = $this->actingAs($user->fresh())->postJson(route('chat.react', ['messageId' => $messageId]), [
            'emoji' => '👍',
        ]);

        $reactResponse->assertStatus(200);
        $reactResponse->assertJsonPath('added', true);
    }

    public function test_employee_can_mark_conversation_as_read(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $channel = ChatChannelMetadata::where('department_id', $dept->id)->firstOrFail();

        $response = $this->actingAs($user->fresh())->postJson(route('chat.read', $channel->conversation_id));

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_employee_can_fetch_vault_data(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $channel = ChatChannelMetadata::where('department_id', $dept->id)->firstOrFail();

        $response = $this->actingAs($user->fresh())->getJson(route('chat.vault', $channel->conversation_id));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'media',
            'files',
            'members',
            'pinned',
        ]);
    }

    public function test_sender_can_fetch_message_read_receipts(): void
    {
        $dept = Department::first();
        $user = User::factory()->create(['role' => 'Employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'status' => 'Permanent',
        ]);

        $channel = ChatChannelMetadata::where('department_id', $dept->id)->firstOrFail();

        // Send a message
        $sendResponse = $this->actingAs($user->fresh())->postJson(route('chat.send', $channel->conversation_id), [
            'body' => 'Checking read receipts roster',
        ]);
        $messageId = $sendResponse->json('message.id');

        $receiptsResponse = $this->actingAs($user->fresh())->getJson(route('chat.receipts', ['messageId' => $messageId]));

        $receiptsResponse->assertStatus(200);
        $receiptsResponse->assertJsonStructure([
            'message_id',
            'readers',
        ]);
    }
}
