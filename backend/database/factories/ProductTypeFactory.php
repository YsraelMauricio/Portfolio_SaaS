<?php

namespace Database\Factories;

use App\Models\ProductType;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductType>
 */
class ProductTypeFactory extends Factory
{
    protected $model = ProductType::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'service_category_id' => ServiceCategoryFactory::new(),
            'name' => $name,
            'slug' => Str::slug($name),
            'base_price_usd' => fake()->randomFloat(2, 100, 5000),
            'base_days_min' => fake()->numberBetween(1, 10),
            'base_days_max' => fake()->numberBetween(10, 30),
            'is_floor_not_ceiling' => false,
            'sort_order' => fake()->numberBetween(1, 100),
            'active' => true,
        ];
    }
}
