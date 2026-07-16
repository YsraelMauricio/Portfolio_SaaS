<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'contract_id' => Contract::factory(),
            'amount_usd' => 1500.00,
            'method' => 'bank_transfer',
            'status' => 'pending',
            'is_test' => false,
        ];
    }

    /**
     * Indicate that this is a bank transfer payment.
     */
    public function bankTransfer(): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => 'bank_transfer',
        ]);
    }

    /**
     * Indicate that the payment has been confirmed.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);
    }
}
