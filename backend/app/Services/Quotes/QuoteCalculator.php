<?php

namespace App\Services\Quotes;

use App\Models\Modifier;
use App\Models\ProductType;

class QuoteCalculator
{
    /**
     * Calculate estimated price and time for a product type + modifier selection.
     *
     * @return array ['estimated_price_min', 'estimated_price_max', 'estimated_days_min', 'estimated_days_max']
     */
    public function calculate(int $productTypeId, array $modifierIds = []): array
    {
        $productType = ProductType::findOrFail($productTypeId);

        $price = (float) $productType->base_price_usd;
        $daysMin = $productType->base_days_min;
        $daysMax = $productType->base_days_max;

        $modifiers = Modifier::whereIn('id', $modifierIds)->get();

        foreach ($modifiers as $modifier) {
            if ($modifier->impact_type === 'additive') {
                $price += (float) $modifier->price_impact_usd;
                $daysMin += $modifier->time_impact_days;
                $daysMax += $modifier->time_impact_days;
            } elseif ($modifier->impact_type === 'multiplier') {
                $price *= (1 + (float) $modifier->price_impact_usd / 100);
                $daysMin = (int) round($daysMin * (1 + $modifier->time_impact_days / 100));
                $daysMax = (int) round($daysMax * (1 + $modifier->time_impact_days / 100));
            }
        }

        // If is_floor_not_ceiling, keep max as "from X" — ensure min >= base_days_min
        if ($productType->is_floor_not_ceiling) {
            $daysMax = max($daysMax, $daysMin);
        }

        // Ensure days are at least 1
        $daysMin = max(1, $daysMin);
        $daysMax = max(1, $daysMax);
        // Ensure max >= min
        $daysMax = max($daysMax, $daysMin);
        // Price at least 0
        $price = max(0, $price);

        return [
            'estimated_price_min' => round($price, 2),
            'estimated_price_max' => round($price * 1.15, 2), // 15% buffer
            'estimated_days_min' => $daysMin,
            'estimated_days_max' => $daysMax,
        ];
    }
}
