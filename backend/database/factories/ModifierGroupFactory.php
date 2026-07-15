<?php

namespace Database\Factories;

use App\Models\ModifierGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ModifierGroup>
 */
class ModifierGroupFactory extends Factory
{
    protected $model = ModifierGroup::class;

    public function definition(): array
    {
        return [
            'product_type_id' => null,
            'name' => fake()->unique()->words(3, true),
            'allows_multiple' => false,
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }
}
