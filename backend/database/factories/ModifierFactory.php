<?php

namespace Database\Factories;

use App\Models\Modifier;
use App\Models\ModifierGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Modifier>
 */
class ModifierFactory extends Factory
{
    protected $model = Modifier::class;

    public function definition(): array
    {
        return [
            'modifier_group_id' => ModifierGroupFactory::new(),
            'name' => fake()->unique()->words(3, true),
            'price_impact_usd' => fake()->randomFloat(2, -200, 1000),
            'time_impact_days' => fake()->numberBetween(-5, 10),
            'impact_type' => 'additive',
            'sort_order' => fake()->numberBetween(1, 100),
            'active' => true,
        ];
    }
}
