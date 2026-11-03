<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PhoneLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_authenticate_with_dashed_phone(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-36-75-99-82',
            'file_no' => 'A-001',
        ]);

        $response = $this->post('/login', [
            'login' => '09-36-75-99-82',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('portal.profile', absolute: false));
    }

    public function test_employee_can_authenticate_with_clean_10_digit_phone(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-36-75-99-82',
            'file_no' => 'A-002',
        ]);

        $response = $this->post('/login', [
            'login' => '0936759982',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('portal.profile', absolute: false));
    }

    public function test_employee_can_authenticate_with_plus_251_international_phone(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-36-75-99-82',
            'file_no' => 'A-003',
        ]);

        $response = $this->post('/login', [
            'login' => '+251936759982',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('portal.profile', absolute: false));
    }

    public function test_employee_cannot_authenticate_with_file_number(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-12-34-56-78',
            'file_no' => 'A-099',
        ]);

        $response = $this->post('/login', [
            'login' => 'a-099',
            'password' => 'secret123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors();
    }

    public function test_employee_can_authenticate_with_9_digit_phone_starting_with_9(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-36-75-99-82',
            'file_no' => 'A-004',
        ]);

        $response = $this->post('/login', [
            'login' => '936759982',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('portal.profile', absolute: false));
    }

    public function test_admin_can_authenticate_with_email_and_redirect_to_dashboard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@elhadar.com',
            'password' => Hash::make('password'),
            'role' => 'HRAdmin',
        ]);

        $response = $this->post('/login', [
            'login' => 'admin@elhadar.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($admin);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_authentication_fails_with_wrong_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
            'role' => 'Employee',
        ]);
        $dept = Department::factory()->create();
        Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $dept->id,
            'phone' => '09-11-22-33-44',
            'file_no' => 'A-100',
        ]);

        $response = $this->post('/login', [
            'login' => '0911223344',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors();
    }
}
