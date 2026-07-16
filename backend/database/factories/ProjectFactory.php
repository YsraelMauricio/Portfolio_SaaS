<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => 'submitted',
            'paused_days' => 0,
            'scope_changed' => false,
            'is_test' => false,
        ];
    }

    /**
     * Indicate that the project is a test project.
     */
    public function testProject(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_test' => true,
        ]);
    }
}
