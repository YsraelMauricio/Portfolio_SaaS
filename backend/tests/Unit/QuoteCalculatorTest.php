<?php

namespace Tests\Unit;

use App\Models\Modifier;
use App\Models\ProductType;
use App\Services\Quotes\QuoteCalculator;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class QuoteCalculatorTest extends TestCase
{
    use LazilyRefreshDatabase;

    private QuoteCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->calculator = new QuoteCalculator;
    }

    // ─── Landing page, no modifiers ──────────────────────────────────────────

    public function test_landing_page_with_no_modifiers_returns_base_price_plus_15_percent_buffer(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 350.00,
            'base_days_min' => 5,
            'base_days_max' => 5,
            'is_floor_not_ceiling' => false,
        ]);

        $result = $this->calculator->calculate($productType->id, []);

        $this->assertEquals(350.00, $result['estimated_price_min']);
        $this->assertEquals(402.50, $result['estimated_price_max']); // 350 * 1.15
        $this->assertEquals(5, $result['estimated_days_min']);
        $this->assertEquals(5, $result['estimated_days_max']);
    }

    // ─── Additive modifier ───────────────────────────────────────────────────

    public function test_with_additive_modifier_price_decreases(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 350.00,
            'base_days_min' => 5,
            'base_days_max' => 5,
            'is_floor_not_ceiling' => false,
        ]);

        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => -100.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        $this->assertEquals(250.00, $result['estimated_price_min']); // 350 - 100
        $this->assertEquals(287.50, $result['estimated_price_max']); // 250 * 1.15
        $this->assertEquals(5, $result['estimated_days_min']);
        $this->assertEquals(5, $result['estimated_days_max']);
    }

    // ─── Multiple additive modifiers ─────────────────────────────────────────

    public function test_with_multiple_additive_modifiers(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 800.00,
            'base_days_min' => 15,
            'base_days_max' => 15,
            'is_floor_not_ceiling' => false,
        ]);

        $fullStack = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 500.00,
            'time_impact_days' => 5,
            'impact_type' => 'additive',
        ]);

        $premiumUx = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 600.00,
            'time_impact_days' => 4,
            'impact_type' => 'additive',
        ]);

        $blog = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 150.00,
            'time_impact_days' => 2,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [
            $fullStack->id, $premiumUx->id, $blog->id
        ]);

        // 800 + 500 + 600 + 150 = 2050
        $this->assertEquals(2050.00, $result['estimated_price_min']);
        // 2050 * 1.15 = 2357.50
        $this->assertEquals(2357.50, $result['estimated_price_max']);
        // 15 + 5 + 4 + 2 = 26
        $this->assertEquals(26, $result['estimated_days_min']);
        $this->assertEquals(26, $result['estimated_days_max']);
    }

    // ─── Multiplier modifier ─────────────────────────────────────────────────

    public function test_with_multiplier_modifier_increases_price_by_percentage(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 1000.00,
            'base_days_min' => 10,
            'base_days_max' => 15,
            'is_floor_not_ceiling' => false,
        ]);

        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 20.00,  // 20% increase
            'time_impact_days' => 10,     // 10% increase
            'impact_type' => 'multiplier',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        // 1000 * 1.20 = 1200
        $this->assertEquals(1200.00, $result['estimated_price_min']);
        // 1200 * 1.15 = 1380
        $this->assertEquals(1380.00, $result['estimated_price_max']);
        // round(5 * 1.10) = 6, round(5 * 1.10) = 6
        $this->assertEquals(6, $result['estimated_days_min']);
        $this->assertEquals(6, $result['estimated_days_max']);
    }

    // ─── is_floor_not_ceiling ────────────────────────────────────────────────

    public function test_saas_is_floor_not_ceiling_displays_days_correctly(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 5000.00,
            'base_days_min' => 30,
            'base_days_max' => 30,
            'is_floor_not_ceiling' => true,
        ]);

        $result = $this->calculator->calculate($productType->id, []);

        // With is_floor_not_ceiling, max should be at least min
        $this->assertEquals(30, $result['estimated_days_min']);
        $this->assertEquals(30, $result['estimated_days_max']);
        $this->assertGreaterThanOrEqual($result['estimated_days_min'], $result['estimated_days_max']);
    }

    public function test_is_floor_not_ceiling_with_modifier_that_reduces_days(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 5000.00,
            'base_days_min' => 30,
            'base_days_max' => 30,
            'is_floor_not_ceiling' => true,
        ]);

        // A modifier that reduces days (e.g. urgent: -2 days)
        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 0.00,
            'time_impact_days' => -2,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        // With is_floor_not_ceiling, max should be at least min
        $this->assertEquals(28, $result['estimated_days_min']);
        $this->assertEquals(28, $result['estimated_days_max']);
        $this->assertGreaterThanOrEqual($result['estimated_days_min'], $result['estimated_days_max']);
    }

    // ─── Negative time impact ────────────────────────────────────────────────

    public function test_negative_time_impact_reduces_days(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 100.00,
            'base_days_min' => 3,
            'base_days_max' => 5,
            'is_floor_not_ceiling' => false,
        ]);

        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 100.00,
            'time_impact_days' => -2,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        $this->assertEquals(1, $result['estimated_days_min']); // 3 - 2 = 1
        $this->assertEquals(3, $result['estimated_days_max']); // 5 - 2 = 3
        $this->assertEquals(200.00, $result['estimated_price_min']); // 100 + 100
    }

    // ─── Minimum safeguard ───────────────────────────────────────────────────

    public function test_minimum_safeguard_ensures_price_not_negative(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 50.00,
            'base_days_min' => 1,
            'base_days_max' => 3,
            'is_floor_not_ceiling' => false,
        ]);

        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => -200.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        // 50 - 200 = -150, clamped to 0
        $this->assertEquals(0.00, $result['estimated_price_min']);
        $this->assertEquals(0.00, $result['estimated_price_max']); // 0 * 1.15 = 0
    }

    public function test_minimum_safeguard_ensures_days_at_least_one(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 100.00,
            'base_days_min' => 1,
            'base_days_max' => 2,
            'is_floor_not_ceiling' => false,
        ]);

        $modifier = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 0.00,
            'time_impact_days' => -5,
            'impact_type' => 'additive',
        ]);

        $result = $this->calculator->calculate($productType->id, [$modifier->id]);

        // 1 - 5 = -4, clamped to 1
        $this->assertEquals(1, $result['estimated_days_min']);
        // 2 - 5 = -3, clamped to 1, then max >= min ensures max >= 1
        $this->assertEquals(1, $result['estimated_days_max']);
    }

    // ─── Max >= min guarantee ────────────────────────────────────────────────

    public function test_max_is_always_greater_or_equal_to_min(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 100.00,
            'base_days_min' => 10,
            'base_days_max' => 5, // Intentionally inverted to test safeguard
            'is_floor_not_ceiling' => false,
        ]);

        $result = $this->calculator->calculate($productType->id, []);

        $this->assertGreaterThanOrEqual($result['estimated_days_min'], $result['estimated_days_max']);
    }

    // ─── Multiplier with additive combined ───────────────────────────────────

    public function test_additive_and_multiplier_modifiers_combine_correctly(): void
    {
        $productType = ProductType::factory()->create([
            'base_price_usd' => 1000.00,
            'base_days_min' => 10,
            'base_days_max' => 15,
            'is_floor_not_ceiling' => false,
        ]);

        $additiveMod = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 200.00,
            'time_impact_days' => 2,
            'impact_type' => 'additive',
        ]);

        $multiplierMod = \App\Models\Modifier::factory()->create([
            'price_impact_usd' => 10.00,  // 10% increase
            'time_impact_days' => 0,
            'impact_type' => 'multiplier',
        ]);

        $result = $this->calculator->calculate($productType->id, [$additiveMod->id, $multiplierMod->id]);

        // (1000 + 200) * 1.10 = 1320
        $this->assertEquals(1320.00, $result['estimated_price_min']);
        // 1320 * 1.15 = 1518
        $this->assertEquals(1518.00, $result['estimated_price_max']);
        // (10 + 2) * 1.0 = 12, (10 + 2) * 1.0 = 12
        $this->assertEquals(12, $result['estimated_days_min']);
        $this->assertEquals(12, $result['estimated_days_max']);
    }
}
