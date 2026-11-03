<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'file_no' => 'F-'.fake()->unique()->numberBetween(1000, 9999),
            'full_name' => fake()->name(),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'department_id' => Department::factory(),
            'position' => fake()->jobTitle(),
            'work_place' => fake()->randomElement(['Project', 'Head Office']),
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Permanent',
            'employment_date_ec' => '01/01/2015',
            'employment_date' => Carbon::now()->subYears(3)->toDateString(),
            'birth_date_ec' => '01/01/1990',
            'birth_date' => Carbon::now()->subYears(35)->toDateString(),
            'bank_name' => 'Commercial Bank of Ethiopia (CBE)',
            'bank_account_no' => '1000'.fake()->numerify('##########'),
        ];
    }

    public function probation(): static
    {
        return $this->state(fn () => [
            'status' => 'Probation',
            'contract_type' => 'Permanent',
            'probation_end_date' => Carbon::now()->addDays(30)->toDateString(),
            'probation_status' => 'Pending',
        ]);
    }

    public function nearingRetirement(): static
    {
        return $this->state(fn () => [
            'birth_date' => Carbon::now()->subYears(60)->addDays(45)->toDateString(),
            'retirement_date' => Carbon::now()->addDays(45)->toDateString(),
            'status' => 'Permanent',
        ]);
    }

    public function separated(): static
    {
        return $this->state(fn () => [
            'status' => 'Separated',
        ]);
    }
}
