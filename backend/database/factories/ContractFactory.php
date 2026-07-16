<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    protected $model = Contract::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'quote_snapshot' => [
                'product_type_name' => 'Landing Page',
                'price_usd' => 1500.00,
                'estimated_days_min' => 10,
                'estimated_days_max' => 20,
                'modifiers' => ['Blog', 'Contact Form'],
                'technologies' => ['React', 'Tailwind'],
            ],
            'status' => 'draft',
            'generated_at' => now(),
            'is_test' => false,
        ];
    }

    /**
     * Indicate that the contract has been sent.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'documenso_document_id' => 'DOCUMENSO_MOCK_'.fake()->unique()->randomNumber(),
            'approved_by_admin_at' => now(),
            'sent_at' => now(),
        ]);
    }

    /**
     * Indicate that the contract has been signed.
     */
    public function signed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'signed',
            'documenso_document_id' => 'DOCUMENSO_MOCK_'.fake()->unique()->randomNumber(),
            'approved_by_admin_at' => now(),
            'sent_at' => now(),
            'signed_at' => now(),
        ]);
    }

    /**
     * Indicate that the contract has been cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }
}
