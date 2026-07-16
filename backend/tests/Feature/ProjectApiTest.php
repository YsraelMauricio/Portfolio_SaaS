<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectApiTest extends TestCase
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

        // Create an admin
        $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@test.com']);
        $this->admin->assignRole('admin');

        // Create a client
        $this->client = User::factory()->create(['name' => 'Client', 'email' => 'client@test.com']);
        $this->client->assignRole('client');

        // Create another client
        $this->otherClient = User::factory()->create(['name' => 'Other', 'email' => 'other@test.com']);
        $this->otherClient->assignRole('client');
    }

    // ─── GET /api/v1/projects (Index) ──────────────────────────────────────

    public function test_client_sees_only_their_own_projects(): void
    {
        // Create projects for the main client
        Project::factory()->count(3)->create([
            'user_id' => $this->client->id,
        ]);

        // Create projects for the other client
        Project::factory()->count(2)->create([
            'user_id' => $this->otherClient->id,
        ]);

        $response = $this->actingAs($this->client)
            ->getJson('/api/v1/projects');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'user_id', 'status', 'is_test', 'created_at'],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);

        // Should only see 3 projects (their own)
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(3, $response->json('meta.total'));

        // Verify all returned projects belong to the client
        foreach ($response->json('data') as $project) {
            $this->assertEquals($this->client->id, $project['user_id']);
        }
    }

    public function test_admin_sees_all_non_test_projects(): void
    {
        Project::factory()->count(3)->create([
            'user_id' => $this->client->id,
        ]);
        Project::factory()->count(2)->create([
            'user_id' => $this->otherClient->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/projects');

        $response->assertStatus(200);
        // Admin should see all 5 non-test projects
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_sees_test_projects_with_is_test_param(): void
    {
        Project::factory()->count(2)->create([
            'user_id' => $this->client->id,
        ]);
        Project::factory()->count(3)->testProject()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/projects?is_test=1');

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('meta.total'));

        foreach ($response->json('data') as $project) {
            $this->assertTrue($project['is_test']);
        }
    }

    public function test_unauthenticated_user_cannot_view_projects(): void
    {
        $this->getJson('/api/v1/projects')
            ->assertStatus(401);
    }

    // ─── GET /api/v1/projects/{id} (Show) ──────────────────────────────────

    public function test_client_views_their_own_project(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)
            ->getJson("/api/v1/projects/{$project->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'user_id',
                'status',
                'is_test',
                'milestones',
            ],
        ]);
        $this->assertEquals($project->id, $response->json('data.id'));
    }

    public function test_other_client_gets_404_for_someone_elses_project(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->otherClient)
            ->getJson("/api/v1/projects/{$project->id}");

        $response->assertStatus(404);
        $response->assertJson([
            'errors' => ['project' => ['Project not found.']],
        ]);
    }

    // ─── PATCH /api/v1/admin/projects/{id} (Update) ────────────────────────

    public function test_admin_updates_project_status_to_delivered(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'in_development',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/projects/{$project->id}", [
                'status' => 'delivered',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('delivered', $response->json('data.status'));
        $this->assertNotNull($response->json('data.actual_delivery_date'));
    }

    public function test_admin_updates_project_scope_changed(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'in_development',
            'scope_changed' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/projects/{$project->id}", [
                'scope_changed' => true,
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.scope_changed'));
    }

    public function test_admin_cannot_change_status_from_terminal_status(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'delivered',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/projects/{$project->id}", [
                'status' => 'in_development',
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => ['status' => [
                'Cannot change status from "delivered". Terminal statuses cannot be changed.',
            ]],
        ]);
    }

    // ─── POST /api/v1/admin/projects/{id}/milestones ───────────────────────

    public function test_admin_creates_milestone(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/projects/{$project->id}/milestones", [
                'name' => 'Design Review',
                'estimated_date' => '2026-08-15',
                'sort_order' => 1,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'project_id',
                'name',
                'estimated_date',
                'sort_order',
            ],
        ]);
        $this->assertEquals('Design Review', $response->json('data.name'));
        $this->assertEquals($project->id, $response->json('data.project_id'));

        // Verify milestone exists in database
        $this->assertDatabaseHas('project_milestones', [
            'project_id' => $project->id,
            'name' => 'Design Review',
        ]);
    }

    public function test_admin_creates_milestone_with_completed_date(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/projects/{$project->id}/milestones", [
                'name' => 'Deployment',
                'estimated_date' => '2026-09-01',
                'completed_date' => '2026-09-05',
                'sort_order' => 2,
            ]);

        $response->assertStatus(201);
        $this->assertEquals('Deployment', $response->json('data.name'));
        $this->assertStringStartsWith('2026-09-05', $response->json('data.completed_date'));
    }

    // ─── PATCH /api/v1/admin/projects/{id}/pause-clock ─────────────────────

    public function test_admin_pauses_clock_increments_paused_days(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->client->id,
            'paused_days' => 0,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/projects/{$project->id}/pause-clock");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('data.paused_days'));

        // Pause again
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/projects/{$project->id}/pause-clock");

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('data.paused_days'));
    }
}
