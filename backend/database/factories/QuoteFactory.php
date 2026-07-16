<?php

namespace Database\Factories;

use App\Models\ProductType;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quote>
 */
class QuoteFactory extends Factory
{
    protected $model = Quote::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_type_id' => ProductType::factory(),
            'estimated_price_min' => 1000.00,
            'estimated_price_max' => 2000.00,
            'estimated_days_min' => 10,
            'estimated_days_max' => 20,
            'currency' => 'USD',
            'status' => 'saved',
            'is_test' => false,
            'locale' => 'en',
        ];
    }
}
