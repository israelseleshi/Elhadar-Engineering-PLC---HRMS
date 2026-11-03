<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SyncEmployeeUsersCommand extends Command
{
    protected $signature = 'hrms:sync-users {--password=password : Default password for generated accounts}';

    protected $description = 'Generates and links User login credentials for all employee records without an active user account';

    public function handle(): int
    {
        $defaultPassword = $this->option('password') ?: 'password';
        $hashedPassword = Hash::make($defaultPassword);
        $employees = Employee::whereNull('user_id')->get();

        $this->info("Found {$employees->count()} employee(s) without linked User accounts.");

        if ($employees->isEmpty()) {
            $this->info('All employees already have linked accounts.');

            return self::SUCCESS;
        }

        $created = 0;

        foreach ($employees as $employee) {
            $email = null;

            if (! empty($employee->email) && filter_var($employee->email, FILTER_VALIDATE_EMAIL)) {
                if (! User::where('email', $employee->email)->exists()) {
                    $email = strtolower(trim($employee->email));
                }
            }

            if (! $email) {
                $cleanFileNo = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $employee->file_no));
                $email = "{$cleanFileNo}@elhadar.local";

                if (User::where('email', $email)->exists()) {
                    $email = "{$cleanFileNo}.{$employee->id}@elhadar.local";
                }
            }

            $user = User::create([
                'name' => $employee->full_name,
                'email' => $email,
                'password' => $hashedPassword,
                'role' => 'Employee',
            ]);

            $employee->update(['user_id' => $user->id]);
            $created++;
        }

        $this->info("Successfully created and linked {$created} User accounts with role 'Employee'. Default password: '{$defaultPassword}'.");

        return self::SUCCESS;
    }
}
