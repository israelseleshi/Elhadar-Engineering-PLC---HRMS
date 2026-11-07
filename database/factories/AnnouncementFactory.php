<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(6),
            'content' => fake()->paragraphs(3, true),
            'is_pinned' => fake()->boolean(20),
            'is_active' => true,
            'published_at' => fake()->dateTimeBetween('-30 days', '+7 days'),
            'expires_at' => fake()->optional()->dateTimeBetween('+1 month', '+6 months'),
            'created_by' => User::inRandomOrder()->first()?->id ?? User::factory()->hrAdmin()->create()->id,
        ];
    }

    public function pinned(): static
    {
        return $this->state(fn () => ['is_pinned' => true]);
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
            'published_at' => null,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => fake()->dateTimeBetween('-6 months', '-1 days'),
        ]);
    }
}
