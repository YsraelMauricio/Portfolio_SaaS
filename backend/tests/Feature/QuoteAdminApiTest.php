<?php

namespace Tests\Feature;

use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QuoteAdminApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private string $adminToken;

    private string $clientToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(QuoteEngineSeeder::class);
        Storage::fake('public');

        // Create an admin user
        $adminResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $this->adminToken = $adminResponse->json('data.token');
        $adminUser = User::where('email', 'admin@example.com')->first();
        $adminUser->assignRole('admin');
        $adminUser->update(['two_factor_enabled' => true]);

        // Create a client user
        $clientResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Client User',
            'email' => 'client@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $this->clientToken = $clientResponse->json('data.token');

        $this->withSession(['2fa_verified' => true]);
    }

    // ─── GET /api/v1/admin/quotes/categories ─────────────────────────────────

    public function test_admin_categories_returns_200_as_admin(): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/admin/quotes/categories');

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
    }

    public function test_admin_categories_returns_403_as_client(): void
    {
        $response = $this->withToken($this->clientToken)
            ->getJson('/api/v1/admin/quotes/categories');

        $response->assertStatus(403);
    }

    // ─── POST /api/v1/admin/quotes/categories ───────────────────────────────

    public function test_admin_store_category_returns_201(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/admin/quotes/categories', [
                'name' => 'AI Solutions',
                'slug' => 'ai-solutions',
                'sort_order' => 6,
                'active' => true,
            ]);

        $response->assertStatus(201);
        $response->assertJson([
            'data' => [
                'name' => 'AI Solutions',
                'slug' => 'ai-solutions',
                'sort_order' => 6,
                'active' => true,
            ],
        ]);
    }

    // ─── PATCH /api/v1/admin/quotes/categories/{id} ─────────────────────────

    public function test_admin_update_category_returns_200(): void
    {
        $category = ServiceCategory::first();

        $response = $this->withToken($this->adminToken)
            ->patchJson("/api/v1/admin/quotes/categories/{$category->id}", [
                'name' => 'Updated Category',
                'slug' => 'updated-category',
                'sort_order' => 10,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Updated Category', $response->json('data.name'));
        $this->assertEquals('updated-category', $response->json('data.slug'));
    }

    // ─── POST /api/v1/admin/quotes/product-types ────────────────────────────

    public function test_admin_store_product_type_returns_201(): void
    {
        $category = ServiceCategory::first();

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/admin/quotes/product-types', [
                'service_category_id' => $category->id,
                'name' => 'Custom App',
                'slug' => 'custom-app',
                'base_price_usd' => 1500.00,
                'base_days_min' => 10,
                'base_days_max' => 15,
                'sort_order' => 1,
                'active' => true,
            ]);

        $response->assertStatus(201);
        $this->assertEquals('Custom App', $response->json('data.name'));
        $this->assertEquals(1500.00, (float) $response->json('data.base_price_usd'));
    }

    // ─── POST /api/v1/admin/quotes/modifier-groups ──────────────────────────

    public function test_admin_store_modifier_group_returns_201(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/admin/quotes/modifier-groups', [
                'name' => 'Test Group',
                'allows_multiple' => true,
                'sort_order' => 10,
            ]);

        $response->assertStatus(201);
        $this->assertEquals('Test Group', $response->json('data.name'));
        $this->assertTrue($response->json('data.allows_multiple'));
    }

    // ─── POST /api/v1/admin/quotes/modifiers ────────────────────────────────

    public function test_admin_store_modifier_returns_201(): void
    {
        $group = ModifierGroup::first();

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/admin/quotes/modifiers', [
                'modifier_group_id' => $group->id,
                'name' => 'Test Modifier',
                'price_impact_usd' => 250.00,
                'time_impact_days' => 3,
                'impact_type' => 'additive',
                'sort_order' => 10,
                'active' => true,
            ]);

        $response->assertStatus(201);
        $this->assertEquals('Test Modifier', $response->json('data.name'));
        $this->assertEquals(250.00, (float) $response->json('data.price_impact_usd'));
    }

    // ─── PATCH /api/v1/admin/quotes/modifiers/{id} with price change ────────

    public function test_admin_update_modifier_price_creates_price_change_history(): void
    {
        $modifier = Modifier::first();

        $response = $this->withToken($this->adminToken)
            ->patchJson("/api/v1/admin/quotes/modifiers/{$modifier->id}", [
                'price_impact_usd' => 999.99,
                'reason' => 'Market adjustment',
            ]);

        $response->assertStatus(200);
        $this->assertEquals(999.99, (float) $response->json('data.price_impact_usd'));

        // Assert a price_change_history row was created
        $this->assertDatabaseHas('price_change_history', [
            'changeable_type' => Modifier::class,
            'changeable_id' => $modifier->id,
            'new_value' => 999.99,
            'reason' => 'Market adjustment',
        ]);
    }

    public function test_admin_update_modifier_without_price_change_does_not_create_history(): void
    {
        $modifier = Modifier::first();

        $response = $this->withToken($this->adminToken)
            ->patchJson("/api/v1/admin/quotes/modifiers/{$modifier->id}", [
                'name' => 'Renamed Modifier',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Renamed Modifier', $response->json('data.name'));

        // No price_change_history should be created
        $this->assertDatabaseMissing('price_change_history', [
            'changeable_id' => $modifier->id,
        ]);
    }
}
