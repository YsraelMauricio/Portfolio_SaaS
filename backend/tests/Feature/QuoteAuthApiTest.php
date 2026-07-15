<?php

namespace Tests\Feature;

use App\Models\Modifier;
use App\Models\ProductType;
use App\Models\User;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QuoteAuthApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private string $token;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(QuoteEngineSeeder::class);
        Storage::fake('public');

        // Register a user for authenticated tests
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Quote User',
            'email' => 'quoteuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->token = $response->json('data.token');
        $this->user = User::where('email', 'quoteuser@example.com')->first();
    }

    // ─── POST /api/v1/quotes/save (unauthenticated) ─────────────────────────

    public function test_save_quote_unauthenticated_returns_401(): void
    {
        $response = $this->postJson('/api/v1/quotes/save', [
            'product_type_id' => 1,
        ]);

        $response->assertStatus(401);
    }

    // ─── POST /api/v1/quotes/save (authenticated) ────────────────────────────

    public function test_save_quote_authenticated_returns_201_with_saved_quote(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        $response = $this->withToken($this->token)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'user_id',
                'product_type_id',
                'estimated_price_min',
                'estimated_price_max',
                'estimated_days_min',
                'estimated_days_max',
                'currency',
                'status',
                'is_test',
                'locale',
                'product_type',
                'modifiers',
            ],
        ]);
        $this->assertEquals('saved', $response->json('data.status'));
        $this->assertEquals(350.00, (float) $response->json('data.estimated_price_min'));
    }

    public function test_save_quote_with_modifiers_attaches_them(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();
        $modifier = Modifier::where('name', 'Blog')->first();

        $response = $this->withToken($this->token)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
                'modifier_ids' => [$modifier->id],
            ]);

        $response->assertStatus(201);
        $this->assertCount(1, $response->json('data.modifiers'));
        $this->assertEquals($modifier->id, $response->json('data.modifiers.0.id'));
    }

    // ─── GET /api/v1/quotes/mine ────────────────────────────────────────────

    public function test_mine_returns_200_with_user_quotes(): void
    {
        // Save a quote first
        $productType = ProductType::where('slug', 'landing-page')->first();
        $this->withToken($this->token)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
            ]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/quotes/mine');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'user_id',
                    'product_type_id',
                    'estimated_price_min',
                    'estimated_price_max',
                    'estimated_days_min',
                    'estimated_days_max',
                    'currency',
                    'status',
                    'is_test',
                    'locale',
                    'product_type',
                    'modifiers',
                ],
            ],
        ]);
        $this->assertCount(1, $response->json('data'));
    }

    // ─── POST /api/v1/quotes/{id}/send-as-lead ──────────────────────────────

    public function test_send_as_lead_returns_200_with_status_change(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        // Save a quote first
        $saveResponse = $this->withToken($this->token)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
            ]);

        $quoteId = $saveResponse->json('data.id');

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/quotes/{$quoteId}/send-as-lead");

        $response->assertStatus(200);
        $this->assertEquals('sent_as_lead', $response->json('data.status'));
    }

    public function test_send_as_lead_twice_returns_422(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        $saveResponse = $this->withToken($this->token)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
            ]);

        $quoteId = $saveResponse->json('data.id');

        // First send — should succeed
        $this->withToken($this->token)
            ->postJson("/api/v1/quotes/{$quoteId}/send-as-lead")
            ->assertStatus(200);

        // Second send — should fail with 422
        $response = $this->withToken($this->token)
            ->postJson("/api/v1/quotes/{$quoteId}/send-as-lead");

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => ['quote' => ['This quote has already been sent as a lead.']],
        ]);
    }

    public function test_send_as_lead_for_another_users_quote_returns_404(): void
    {
        $productType = ProductType::where('slug', 'landing-page')->first();

        // Create a second user via the model factory
        $otherUser = User::factory()->create();
        $otherUser->assignRole('client');

        // Save a quote as the other user (actingAs ensures correct user)
        $saveResponse = $this->actingAs($otherUser)
            ->postJson('/api/v1/quotes/save', [
                'product_type_id' => $productType->id,
            ]);
        $otherQuoteId = $saveResponse->json('data.id');

        // Try to send as lead as the first user — should get 404
        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/quotes/{$otherQuoteId}/send-as-lead");

        $response->assertStatus(404);
    }
}
