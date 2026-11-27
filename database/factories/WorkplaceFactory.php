<?php

namespace Database\Factories;

use App\Models\Workplace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workplace>
 */
class WorkplaceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->city().' Project',
            'code' => null,
            'type' => 'Project',
            'location' => fake()->city(),
            'description' => null,
            'is_active' => true,
        ];
    }
}
