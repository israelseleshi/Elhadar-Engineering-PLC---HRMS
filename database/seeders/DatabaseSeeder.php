<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. HR Administrator
        User::firstOrCreate(
            ['email' => 'admin@elhadar.com'],
            [
                'name' => 'HR Administrator',
                'password' => Hash::make('password'),
                'role' => 'HRAdmin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Department Manager
        User::firstOrCreate(
            ['email' => 'manager@elhadar.com'],
            [
                'name' => 'Operations Manager',
                'password' => Hash::make('password'),
                'role' => 'Manager',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Employee Self-Service (ESS)
        $employeeUser = User::firstOrCreate(
            ['email' => 'employee@elhadar.com'],
            [
                'name' => 'Abay Sewmehon Demena',
                'password' => Hash::make('password'),
                'role' => 'Employee',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $firstEmployee = Employee::first();
        if ($firstEmployee) {
            $firstEmployee->update(['user_id' => $employeeUser->id]);
        }

        // 4. Sample announcements
        Announcement::factory()->count(5)->create();
    }
}
