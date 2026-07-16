<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Testimonial;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class TestimonialApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private Testimonial $approved;

    private Testimonial $pending;

    private Testimonial $rejected;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        $this->approved = Testimonial::create([
            'client_name' => 'John Doe',
            'company_role' => 'CEO at Acme',
            'content' => 'Amazing work!',
            'rating' => 5,
            'status' => 'approved',
        ]);

        $this->pending = Testimonial::create([
            'client_name' => 'Jane Smith',
            'content' => 'Great service.',
            'status' => 'pending',
        ]);

        $this->rejected = Testimonial::create([
            'client_name' => 'Bob',
            'content' => 'Not good.',
            'status' => 'rejected',
        ]);
    }

    // ─── Public: GET /testimonials ───────────────────────────────────────────

    public function test_public_can_list_approved_testimonials(): void
    {
        $response = $this->getJson('/api/v1/testimonials');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.client_name', 'John Doe');
    }

    public function test_public_does_not_see_pending_or_rejected_testimonials(): void
    {
        $response = $this->getJson('/api/v1/testimonials');

        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('client_name');
        $this->assertFalse($names->contains('Jane Smith'));
        $this->assertFalse($names->contains('Bob'));
    }

    // ─── Authenticated: POST /testimonials ───────────────────────────────────

    public function test_authenticated_user_can_create_testimonial(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/testimonials', [
                'client_name' => 'New Client',
                'content' => 'Fantastic experience!',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.client_name', 'New Client');
        $response->assertJsonPath('data.status', 'pending');
    }

    public function test_authenticated_user_can_create_testimonial_with_all_fields(): void
    {
        $project = Project::factory()->create(['user_id' => $this->client->id]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/testimonials', [
                'client_name' => 'Full Client',
                'company_role' => 'Developer',
                'content' => 'Full testimonial',
                'rating' => 4,
                'project_id' => $project->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.client_name', 'Full Client');
        $response->assertJsonPath('data.rating', 4);
    }

    public function test_create_testimonial_requires_client_name_and_content(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/testimonials', []);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_user_cannot_create_testimonial(): void
    {
        $response = $this->postJson('/api/v1/testimonials', [
            'client_name' => 'Guest',
            'content' => 'Test',
        ]);

        $response->assertStatus(401);
    }

    // ─── Admin: Approve/Reject ─────────────────────────────────────────────

    public function test_admin_can_approve_testimonial(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/testimonials/'.$this->pending->id.'/approve');

        $response->assertStatus(200);
        $this->assertDatabaseHas('testimonials', [
            'id' => $this->pending->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_reject_testimonial(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/testimonials/'.$this->pending->id.'/reject');

        $response->assertStatus(200);
        $this->assertDatabaseHas('testimonials', [
            'id' => $this->pending->id,
            'status' => 'rejected',
        ]);
    }

    public function test_approve_and_reject_are_separate_endpoints(): void
    {
        // Reject should set status to 'rejected', not 'approved'
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/testimonials/'.$this->pending->id.'/reject');

        $this->assertDatabaseHas('testimonials', [
            'id' => $this->pending->id,
            'status' => 'rejected',
        ]);

        // Approve should set status to 'approved', not 'rejected'
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/testimonials/'.$this->rejected->id.'/approve');

        $this->assertDatabaseHas('testimonials', [
            'id' => $this->rejected->id,
            'status' => 'approved',
        ]);
    }

    public function test_non_admin_cannot_approve_or_reject(): void
    {
        $response = $this->actingAs($this->client)
            ->patchJson('/api/v1/admin/testimonials/'.$this->pending->id.'/approve');

        $response->assertStatus(403);
    }

    public function test_approve_nonexistent_testimonial_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/testimonials/99999/approve');

        $response->assertStatus(404);
    }
}
