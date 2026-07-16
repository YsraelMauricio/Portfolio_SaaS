<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\ProductType;
use App\Models\Project;
use App\Models\Quote;
use App\Models\User;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContractApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private User $otherClient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(QuoteEngineSeeder::class);
        Storage::fake('public');

        // Create an admin user
        $this->admin = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
        $this->admin->assignRole('admin');

        // Create a client user
        $this->client = User::factory()->create(['name' => 'Client User', 'email' => 'client@example.com']);
        $this->client->assignRole('client');

        // Create another client (for the "other client's contract" tests)
        $this->otherClient = User::factory()->create(['name' => 'Other Client', 'email' => 'other@example.com']);
        $this->otherClient->assignRole('client');
    }

    // ─── POST /api/v1/admin/contracts (Store) ──────────────────────────────

    public function test_admin_creates_contract_from_project_with_quote_id(): void
    {
        // Create a quote first
        $productType = ProductType::where('slug', 'landing-page')->first();
        $quote = Quote::create([
            'user_id' => $this->client->id,
            'product_type_id' => $productType->id,
            'estimated_price_min' => 350.00,
            'estimated_price_max' => 500.00,
            'estimated_days_min' => 10,
            'estimated_days_max' => 20,
            'currency' => 'USD',
            'status' => 'sent_as_lead',
            'is_test' => false,
            'locale' => 'en',
        ]);

        // Create a project with quote_id
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'quote_id' => $quote->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/contracts', [
                'project_id' => $project->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'project_id',
                'quote_snapshot',
                'status',
                'generated_at',
                'is_test',
            ],
        ]);
        $this->assertEquals('draft', $response->json('data.status'));
        $this->assertEquals($project->id, $response->json('data.project_id'));

        // Verify quote_snapshot was auto-copied from the quote
        $snapshot = $response->json('data.quote_snapshot');
        $this->assertEquals($productType->name, $snapshot['product_type_name']);
        $this->assertEquals(500.00, (float) $snapshot['price_usd']);
        $this->assertEquals(10, $snapshot['estimated_days_min']);
        $this->assertEquals(20, $snapshot['estimated_days_max']);

        // Verify contract exists in the database
        $this->assertDatabaseHas('contracts', [
            'project_id' => $project->id,
            'status' => 'draft',
        ]);
    }

    public function test_admin_creates_contract_with_quote_snapshot_override(): void
    {
        // Create a project without a quote_id
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'quote_id' => null,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/contracts', [
                'project_id' => $project->id,
                'quote_snapshot_override' => [
                    'product_type_name' => 'Custom Web App',
                    'price_usd' => 5000.00,
                    'estimated_days_min' => 30,
                    'estimated_days_max' => 45,
                    'modifiers' => ['API Integration', 'Database Design'],
                    'technologies' => ['Laravel', 'Vue.js'],
                ],
            ]);

        $response->assertStatus(201);
        $this->assertEquals('draft', $response->json('data.status'));

        // Verify the snapshot contains our override values
        $snapshot = $response->json('data.quote_snapshot');
        $this->assertEquals('Custom Web App', $snapshot['product_type_name']);
        $this->assertEquals(5000.00, (float) $snapshot['price_usd']);
        $this->assertEquals(30, $snapshot['estimated_days_min']);
        $this->assertEquals(45, $snapshot['estimated_days_max']);
        $this->assertContains('API Integration', $snapshot['modifiers']);
        $this->assertContains('Laravel', $snapshot['technologies']);
    }

    public function test_admin_cannot_create_contract_without_quote_or_override(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'quote_id' => null,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/contracts', [
                'project_id' => $project->id,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => ['quote_snapshot_override' => [
                'This project has no associated quote. Provide a quote_snapshot_override to create a contract.',
            ]],
        ]);
    }

    public function test_unauthenticated_user_cannot_create_contract(): void
    {
        $response = $this->postJson('/api/v1/admin/contracts', [
            'project_id' => 1,
        ]);

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_create_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/admin/contracts', [
                'project_id' => $project->id,
            ]);

        $response->assertStatus(403);
    }

    // ─── POST /api/v1/admin/contracts/{id}/approve-send ─────────────────────

    public function test_admin_approves_and_sends_draft_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->create([
            'project_id' => $project->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/contracts/{$contract->id}/approve-send");

        $response->assertStatus(200);
        $this->assertEquals('sent', $response->json('data.status'));
        $this->assertNotNull($response->json('data.documenso_document_id'));
        $this->assertNotNull($response->json('data.approved_by_admin_at'));
        $this->assertNotNull($response->json('data.sent_at'));
    }

    public function test_admin_cannot_approve_already_signed_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->signed()->create([
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/contracts/{$contract->id}/approve-send");

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'Contract must be in "draft" status to approve and send. Current status: signed',
        ]);
    }

    // ─── PATCH /api/v1/admin/contracts/{id}/cancel ──────────────────────────

    public function test_admin_cancels_draft_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->create([
            'project_id' => $project->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/contracts/{$contract->id}/cancel", [
                'reason' => 'Client requested changes',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('data.status'));
        $this->assertNotNull($response->json('data.cancelled_at'));
    }

    public function test_admin_cannot_cancel_signed_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->signed()->create([
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/contracts/{$contract->id}/cancel");

        $response->assertStatus(422);
        $response->assertJsonFragment(['Contract cannot be cancelled from status "signed". Cancellation is only allowed from: draft, approved_pending_send, sent.']);
    }

    // ─── GET /api/v1/contracts/{id} (Client view) ───────────────────────────

    public function test_client_views_their_own_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->signed()->create([
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($this->client)
            ->getJson("/api/v1/contracts/{$contract->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'project_id',
                'quote_snapshot',
                'status',
                'generated_at',
                'signed_at',
                'is_test',
                'created_at',
                'updated_at',
            ],
        ]);
        $this->assertEquals($contract->id, $response->json('data.id'));
        $this->assertEquals('signed', $response->json('data.status'));
    }

    public function test_other_client_gets_404_for_someone_elses_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->create([
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($this->otherClient)
            ->getJson("/api/v1/contracts/{$contract->id}");

        $response->assertStatus(404);
        $response->assertJson([
            'errors' => ['contract' => ['Contract not found.']],
        ]);
    }

    public function test_admin_can_view_any_contract(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);
        $contract = Contract::factory()->signed()->create([
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/contracts/{$contract->id}");

        $response->assertStatus(200);
        $this->assertEquals($contract->id, $response->json('data.id'));
    }

    public function test_unauthenticated_user_cannot_view_contract(): void
    {
        $response = $this->getJson('/api/v1/contracts/1');

        $response->assertStatus(401);
    }
}
