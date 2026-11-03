<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_hr_admin_can_upload_employee_profile_photo(): void
    {
        $admin = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create(['department_id' => $dept->id]);

        $file = UploadedFile::fake()->image('avatar.jpg', 400, 400);

        $response = $this->actingAs($admin)
            ->post(route('employees.photo.store', $employee->id), [
                'photo' => $file,
            ]);

        $response->assertRedirect();
        $employee->refresh();

        $this->assertNotNull($employee->profile_photo_path);
        Storage::disk('public')->assertExists($employee->profile_photo_path);
        $this->assertStringContainsString('storage/photos/employees', $employee->profile_photo_url);
    }

    public function test_hr_admin_can_delete_employee_profile_photo(): void
    {
        $admin = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'profile_photo_path' => 'photos/employees/test.jpg',
        ]);
        Storage::disk('public')->put('photos/employees/test.jpg', 'fake image content');

        $response = $this->actingAs($admin)
            ->delete(route('employees.photo.destroy', $employee->id));

        $response->assertRedirect();
        $employee->refresh();

        $this->assertNull($employee->profile_photo_path);
        $this->assertNull($employee->profile_photo_url);
        Storage::disk('public')->assertMissing('photos/employees/test.jpg');
    }

    public function test_employee_can_upload_own_profile_photo(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'user_id' => $user->id,
        ]);

        $file = UploadedFile::fake()->image('me.png', 300, 300);

        $response = $this->actingAs($user)
            ->post(route('employees.photo.store', $employee->id), [
                'photo' => $file,
            ]);

        $response->assertRedirect();
        $employee->refresh();

        $this->assertNotNull($employee->profile_photo_path);
        Storage::disk('public')->assertExists($employee->profile_photo_path);
    }

    public function test_employee_cannot_upload_photo_for_another_employee(): void
    {
        $user1 = User::factory()->create(['role' => 'Employee']);
        $user2 = User::factory()->create(['role' => 'Employee']);
        $dept = Department::factory()->create();
        $employee2 = Employee::factory()->create([
            'department_id' => $dept->id,
            'user_id' => $user2->id,
        ]);

        $file = UploadedFile::fake()->image('hack.jpg');

        $response = $this->actingAs($user1)
            ->post(route('employees.photo.store', $employee2->id), [
                'photo' => $file,
            ]);

        $response->assertStatus(403);
    }

    public function test_photo_must_be_an_image(): void
    {
        $admin = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create(['department_id' => $dept->id]);

        $file = UploadedFile::fake()->create('document.pdf', 500);

        $response = $this->actingAs($admin)
            ->post(route('employees.photo.store', $employee->id), [
                'photo' => $file,
            ]);

        $response->assertSessionHasErrors(['photo']);
    }
}
