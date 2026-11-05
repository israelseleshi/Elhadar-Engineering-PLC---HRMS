<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SelfServicePhotoTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_update_their_own_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'Employee', 'must_change_password' => false]);
        $employee = Employee::factory()->create(['user_id' => $user->id, 'email' => $user->email]);

        $response = $this->actingAs($user)->post(route('employees.photo.store', $employee), [
            'photo' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
        ]);

        $response->assertSessionHasNoErrors()->assertRedirect();
        $employee->refresh();
        $this->assertNotNull($employee->profile_photo_path);
        Storage::disk('public')->assertExists($employee->profile_photo_path);
    }

    public function test_manager_can_update_their_own_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'Manager', 'must_change_password' => false]);
        $employee = Employee::factory()->create(['user_id' => $user->id, 'email' => $user->email]);

        $response = $this->actingAs($user)->post(route('employees.photo.store', $employee), [
            'photo' => UploadedFile::fake()->image('avatar.png', 200, 200),
        ]);

        $response->assertSessionHasNoErrors()->assertRedirect();
        $this->assertNotNull($employee->fresh()->profile_photo_path);
    }

    public function test_employee_cannot_update_another_employees_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'Employee', 'must_change_password' => false]);
        Employee::factory()->create(['user_id' => $user->id, 'email' => $user->email]);
        $other = Employee::factory()->create();

        $response = $this->actingAs($user)->post(route('employees.photo.store', $other), [
            'photo' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response->assertForbidden();
        $this->assertNull($other->fresh()->profile_photo_path);
    }

    public function test_unlinked_employee_cannot_access_portal_as_another_record(): void
    {
        $user = User::factory()->create(['role' => 'Employee', 'must_change_password' => false]);
        Employee::factory()->create(); // exists but not linked to $user

        $response = $this->actingAs($user)->get(route('portal.profile'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Portal/Profile')->where('employee', null));
    }
}
