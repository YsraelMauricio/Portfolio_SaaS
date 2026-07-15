<?php

namespace Tests\Feature;

use App\Models\Modifier;
use App\Models\ProductType;
use App\Models\ServiceCategory;
use Database\Seeders\QuoteEngineSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class QuoteEngineApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(QuoteEngineSeeder::class);
    }

    // ─── GET /api/v1/quotes/categories ──────────────────────────────────────

    public function test_categories_returns_200_with_categories_list(): void
    {
        $response = $this->getJson('/api/v1/quotes/categories');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'slug',
                    'bolivia_only',
                    'sort_order',
                    'active',
                    'product_types_count',
                ],
            ],
        ]);
        $response->assertJsonCount(5, 'data'); // 5 categories from seeder
    }

    // ─── GET /api/v1/quotes/product-types ───────────────────────────────────

    public function test_product_types_returns_200_with_product_types(): void
    {
        $response = $this->getJson('/api/v1/quotes/product-types');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'slug',
                    'base_price_usd',
                    'base_days_min',
                    'base_days_max',
                    'is_floor_not_ceiling',
                    'sort_order',
                    'active',
                    'category',
                ],
            ],
        ]);
    }

    public function test_product_types_filtered_by_category_id(): void
    {
        $category = ServiceCategory::where('slug', 'web')->first();

        $response = $this->getJson('/api/v1/quotes/product-types?category_id='.$category->id);

        $response->assertStatus(200);
        // Web category has 6 product types in the seeder
        $this->assertCount(6, $response->json('data'));
    }

    public function test_product_types_without_category_id_still_works(): void
    {
        $response = $this->getJson('/api/v1/quotes/product-types');

        $response->assertStatus(200);
        // Should return all product types across all categories
        $this->assertNotEmpty($response->json('data'));
    }

    // ─── GET /api/v1/quotes/modifiers ───────────────────────────────────────

    public function test_modifiers_returns_200_with_grouped_modifiers(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        $response = $this->getJson('/api/v1/quotes/modifiers?product_type_id='.$productType->id);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'allows_multiple',
                    'sort_order',
                    'modifiers' => [
                        '*' => [
                            'id',
                            'name',
                            'price_impact_usd',
                            'time_impact_days',
                            'impact_type',
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function test_modifiers_requires_product_type_id(): void
    {
        $response = $this->getJson('/api/v1/quotes/modifiers');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['product_type_id']);
    }

    // ─── POST /api/v1/quotes/calculate ───────────────────────────────────────

    public function test_calculate_with_valid_data_returns_200_with_calculation(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        $response = $this->postJson('/api/v1/quotes/calculate', [
            'product_type_id' => $productType->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'estimated_price_min',
                'estimated_price_max',
                'estimated_days_min',
                'estimated_days_max',
            ],
        ]);

        // Landing page: base_price_usd = 350, 15% buffer = 402.50
        $this->assertEquals(350.00, $response->json('data.estimated_price_min'));
        $this->assertEquals(402.50, $response->json('data.estimated_price_max'));
        $this->assertEquals(5, $response->json('data.estimated_days_min'));
        $this->assertEquals(5, $response->json('data.estimated_days_max'));
    }

    public function test_calculate_with_modifiers_returns_adjusted_price(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();
        $modifier = Modifier::where('name', 'Full stack')->first();

        $response = $this->postJson('/api/v1/quotes/calculate', [
            'product_type_id' => $productType->id,
            'modifier_ids' => [$modifier->id],
        ]);

        $response->assertStatus(200);
        // Landing page: 350 + 500 (Full stack) = 850, buffer = 977.50
        $this->assertEquals(850.00, $response->json('data.estimated_price_min'));
        $this->assertEquals(977.50, $response->json('data.estimated_price_max'));
        $this->assertEquals(10, $response->json('data.estimated_days_min')); // 5 + 5
        $this->assertEquals(10, $response->json('data.estimated_days_max'));
    }

    public function test_calculate_with_invalid_product_type_id_returns_422(): void
    {
        $response = $this->postJson('/api/v1/quotes/calculate', [
            'product_type_id' => 99999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['product_type_id']);
    }

    public function test_calculate_with_invalid_modifier_id_returns_422(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        $response = $this->postJson('/api/v1/quotes/calculate', [
            'product_type_id' => $productType->id,
            'modifier_ids' => [99999],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['modifier_ids.0']);
    }

    // ─── GET /api/v1/quotes/next-available-start-date ────────────────────────

    public function test_next_available_start_date_returns_200_with_string(): void
    {
        $response = $this->getJson('/api/v1/quotes/next-available-start-date');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'next_available_start_date',
            ],
        ]);
        $this->assertIsString($response->json('data.next_available_start_date'));
    }

    public function test_next_available_start_date_returns_default_when_no_setting(): void
    {
        $response = $this->getJson('/api/v1/quotes/next-available-start-date');

        $response->assertStatus(200);
        $this->assertEquals(
            'As soon as possible — typically within 2 weeks',
            $response->json('data.next_available_start_date')
        );
    }
}
