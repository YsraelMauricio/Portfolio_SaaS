<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\ProfileLink;
use App\Models\Project;
use App\Models\Quote;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');

        // Create admin
        $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@test.com']);
        $this->admin->assignRole('admin');

        // Create client
        $this->client = User::factory()->create(['name' => 'Client', 'email' => 'client@test.com']);
        $this->client->assignRole('client');
    }

    // ─── GET /api/v1/settings/public ───────────────────────────────────────────

    public function test_public_settings_returns_safe_subset(): void
    {
        // Seed some settings
        Setting::create(['key' => 'contact_email', 'value' => 'hello@example.com']);
        Setting::create(['key' => 'contact_phone', 'value' => '+591 70000000']);
        Setting::create(['key' => 'next_available_start_date', 'value' => '2026-08-01']);
        Setting::create(['key' => 'bank_account_number', 'value' => '1234567890']);

        $response = $this->getJson('/api/v1/settings/public');

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'contact_email' => 'hello@example.com',
                'contact_phone' => '+591 70000000',
                'next_available_start_date' => '2026-08-01',
            ],
        ]);

        // Bank details should NOT be exposed
        $response->assertJsonMissing(['bank_account_number']);
    }

    // ─── GET /api/v1/admin/settings ────────────────────────────────────────────

    public function test_admin_settings_returns_all_as_admin(): void
    {
        Setting::create(['key' => 'site_name', 'value' => 'Portfolio SaaS']);
        Setting::create(['key' => 'bank_account_number', 'value' => 'XYZ123']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/settings');

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'site_name' => 'Portfolio SaaS',
                'bank_account_number' => 'XYZ123',
            ],
        ]);
    }

    public function test_admin_settings_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->getJson('/api/v1/admin/settings');

        $response->assertStatus(403);
    }

    // ─── PATCH /api/v1/admin/settings ──────────────────────────────────────────

    public function test_admin_update_settings_returns_updated_settings(): void
    {
        Setting::create(['key' => 'site_name', 'value' => 'Old Name']);

        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', [
                'site_name' => 'New Name',
                'contact_email' => 'new@example.com',
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'site_name' => 'New Name',
                'contact_email' => 'new@example.com',
            ],
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'site_name',
            'value' => 'New Name',
        ]);
    }

    public function test_admin_update_settings_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->patchJson('/api/v1/admin/settings', [
                'site_name' => 'Hacked',
            ]);

        $response->assertStatus(403);
    }

    // ─── GET /api/v1/profile-links ─────────────────────────────────────────────

    public function test_public_profile_links_returns_only_visible(): void
    {
        ProfileLink::create(['key' => 'github', 'url' => 'https://github.com/test', 'visible' => true, 'sort_order' => 1]);
        ProfileLink::create(['key' => 'linkedin', 'url' => 'https://linkedin.com/in/test', 'visible' => true, 'sort_order' => 2]);
        ProfileLink::create(['key' => 'secret', 'url' => 'https://example.com/secret', 'visible' => false, 'sort_order' => 3]);

        $response = $this->getJson('/api/v1/profile-links');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
        $response->assertJson([
            'data' => [
                ['key' => 'github', 'visible' => true],
                ['key' => 'linkedin', 'visible' => true],
            ],
        ]);
    }

    // ─── PATCH /api/v1/admin/profile-links ─────────────────────────────────────

    public function test_admin_update_profile_links(): void
    {
        $link1 = ProfileLink::create(['key' => 'github', 'url' => 'https://github.com/old', 'visible' => true, 'sort_order' => 1]);

        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/profile-links', [
                'links' => [
                    [
                        'id' => $link1->id,
                        'url' => 'https://github.com/new',
                        'visible' => false,
                        'sort_order' => 2,
                    ],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('profile_links', [
            'id' => $link1->id,
            'url' => 'https://github.com/new',
            'visible' => false,
            'sort_order' => 2,
        ]);
    }

    public function test_admin_update_profile_links_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->patchJson('/api/v1/admin/profile-links', [
                'links' => [],
            ]);

        $response->assertStatus(403);
    }

    // ─── GET /api/v1/admin/deleted-users ────────────────────────────────────────

    public function test_admin_deleted_users_returns_soft_deleted_non_anonymized(): void
    {
        // Create a user and soft-delete them (inside retention window)
        $deletedUser = User::factory()->create(['name' => 'Deleted User', 'email' => 'deleted@test.com']);
        $deletedUser->delete();

        // Create a user, soft-delete, then anonymize (outside retention window)
        $anonymizedUser = User::factory()->create(['name' => 'Anonymized', 'email' => 'anonymized@test.com']);
        $anonymizedUser->delete();
        $anonymizedUser->update([
            'name' => 'Anonymous',
            'email' => 'anonymous@deleted',
            'anonymized_at' => now(),
        ]);

        // Active user (not deleted)
        User::factory()->create(['name' => 'Active User', 'email' => 'active@test.com']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/deleted-users');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJson([
            'data' => [
                ['name' => 'Deleted User'],
            ],
        ]);
    }

    public function test_admin_deleted_users_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->getJson('/api/v1/admin/deleted-users');

        $response->assertStatus(403);
    }

    // ─── POST /api/v1/admin/cv ─────────────────────────────────────────────────

    public function test_admin_upload_cv_returns_201(): void
    {
        $file = UploadedFile::fake()->create('cv.pdf', 2048, 'application/pdf');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/cv', [
                'file' => $file,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'file_name',
                'size_bytes',
                'mime_type',
                'updated_at',
            ],
        ]);

        $this->assertEquals('cv.pdf', $response->json('data.file_name'));
    }

    public function test_admin_upload_cv_replaces_existing(): void
    {
        // Upload first CV
        $file1 = UploadedFile::fake()->create('old-cv.pdf', 1024, 'application/pdf');
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/cv', ['file' => $file1]);

        // Upload replacement CV
        $file2 = UploadedFile::fake()->create('new-cv.pdf', 2048, 'application/pdf');
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/cv', ['file' => $file2]);

        $response->assertStatus(201);
        $this->assertEquals('new-cv.pdf', $response->json('data.file_name'));
    }

    public function test_admin_upload_cv_returns_403_for_client(): void
    {
        $file = UploadedFile::fake()->create('cv.pdf', 1024, 'application/pdf');

        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/admin/cv', ['file' => $file]);

        $response->assertStatus(403);
    }

    // ─── GET /api/v1/cv ────────────────────────────────────────────────────────

    public function test_cv_metadata_returns_file_info_when_exists(): void
    {
        // Upload a CV via admin first
        $file = UploadedFile::fake()->create('resume.pdf', 3072, 'application/pdf');
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/cv', ['file' => $file]);

        $response = $this->getJson('/api/v1/cv');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'file_name',
                'updated_at',
                'size_bytes',
            ],
        ]);

        $this->assertEquals('resume.pdf', $response->json('data.file_name'));
        $this->assertNotNull($response->json('data.updated_at'));
    }

    public function test_cv_metadata_returns_null_when_no_cv(): void
    {
        $response = $this->getJson('/api/v1/cv');

        $response->assertStatus(200);
        $this->assertNull($response->json('data'));
    }

    // ─── GET /api/v1/cv/download ───────────────────────────────────────────────

    public function test_cv_download_serves_file(): void
    {
        $file = UploadedFile::fake()->create('my-cv.pdf', 4096, 'application/pdf');
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/cv', ['file' => $file]);

        $response = $this->get('/api/v1/cv/download');

        $response->assertStatus(200);
    }

    public function test_cv_download_returns_404_when_no_cv(): void
    {
        $response = $this->getJson('/api/v1/cv/download');

        $response->assertStatus(404);
    }

    // ─── GET /api/v1/admin/dashboard/metrics ───────────────────────────────────

    public function test_dashboard_metrics_returns_precomputed_values(): void
    {
        // Create projects with various statuses (is_test = false)
        Project::factory()->create(['status' => 'in_development', 'is_test' => false]);
        Project::factory()->create(['status' => 'in_development', 'is_test' => false]);
        Project::factory()->create(['status' => 'delivered', 'is_test' => false]);
        Project::factory()->create(['status' => 'submitted', 'is_test' => false]);

        // Create a test project that should be excluded
        Project::factory()->testProject()->create(['status' => 'in_development']);

        // Create confirmed payments (is_test = false)
        $project = Project::factory()->create(['is_test' => false]);
        $contract = Contract::factory()->signed()->create(['project_id' => $project->id, 'is_test' => false]);
        Payment::factory()->confirmed()->create([
            'project_id' => $project->id,
            'contract_id' => $contract->id,
            'amount_usd' => 1500.00,
            'is_test' => false,
        ]);

        // Create a payment that should be excluded (is_test = true)
        Payment::factory()->confirmed()->create([
            'project_id' => $project->id,
            'contract_id' => $contract->id,
            'amount_usd' => 5000.00,
            'is_test' => true,
        ]);

        // Create pending contracts
        Contract::factory()->create(['status' => 'draft', 'project_id' => $project->id, 'is_test' => false]);

        // Create leads this month
        Quote::factory()->create([
            'status' => 'sent_as_lead',
            'is_test' => false,
            'created_at' => now(),
        ]);

        // Create a delivered project with actual dates for average delivery time
        Project::factory()->create([
            'status' => 'delivered',
            'actual_start_date' => now()->subDays(30),
            'actual_delivery_date' => now()->subDays(5),
            'is_test' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/dashboard/metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'projects_by_status',
                'total_revenue',
                'pending_contracts',
                'new_leads_this_month',
                'average_delivery_days',
            ],
        ]);

        // Verify specific values
        $this->assertEquals(2, $response->json('data.projects_by_status.in_development'));
        $this->assertEquals(2, $response->json('data.projects_by_status.delivered'));
        $this->assertEquals(2, $response->json('data.projects_by_status.submitted'));
        $this->assertEquals(1500.0, $response->json('data.total_revenue'));
        $this->assertEquals(1, $response->json('data.pending_contracts'));
        $this->assertEquals(1, $response->json('data.new_leads_this_month'));
        $this->assertNotNull($response->json('data.average_delivery_days'));
    }

    public function test_dashboard_metrics_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->getJson('/api/v1/admin/dashboard/metrics');

        $response->assertStatus(403);
    }

    // ─── GET /api/v1/admin/dashboard/recalibration ─────────────────────────────

    public function test_dashboard_recalibration_returns_comparison_data(): void
    {
        // Create a delivered project with scope_changed = false and actual dates
        $project1 = Project::factory()->create([
            'status' => 'delivered',
            'confirmed_delivery_date' => now()->addDays(30),
            'actual_delivery_date' => now()->addDays(45), // 15 days late
            'scope_changed' => false,
            'is_test' => false,
        ]);

        Contract::factory()->signed()->create([
            'project_id' => $project1->id,
            'quote_snapshot' => [
                'product_type_name' => 'E-commerce',
                'price_usd' => 3000.00,
                'estimated_days_min' => 20,
                'estimated_days_max' => 30,
                'modifiers' => [],
                'technologies' => [],
            ],
            'is_test' => false,
        ]);

        // Create a project with scope_changed = true (should be excluded)
        $project2 = Project::factory()->create([
            'status' => 'delivered',
            'confirmed_delivery_date' => now()->addDays(20),
            'actual_delivery_date' => now()->addDays(60),
            'scope_changed' => true,
            'is_test' => false,
        ]);

        Contract::factory()->signed()->create([
            'project_id' => $project2->id,
            'quote_snapshot' => [
                'product_type_name' => 'Mobile App',
                'price_usd' => 5000.00,
                'estimated_days_min' => 15,
                'estimated_days_max' => 20,
                'modifiers' => [],
                'technologies' => [],
            ],
            'is_test' => false,
        ]);

        // Create a test project (should be excluded)
        $project3 = Project::factory()->create([
            'status' => 'delivered',
            'confirmed_delivery_date' => now()->addDays(10),
            'actual_delivery_date' => now()->addDays(15),
            'scope_changed' => false,
            'is_test' => true,
        ]);

        Contract::factory()->signed()->create([
            'project_id' => $project3->id,
            'quote_snapshot' => ['product_type_name' => 'Test', 'price_usd' => 100.00],
            'is_test' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/dashboard/recalibration');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'project_id',
                    'product_type_name',
                    'quoted_price',
                    'confirmed_delivery_date',
                    'actual_delivery_date',
                    'deviation_days',
                ],
            ],
        ]);

        // Should only include project1 (scope_changed = false, is_test = false)
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('E-commerce', $response->json('data.0.product_type_name'));
        $this->assertEquals(15, $response->json('data.0.deviation_days'));
    }

    public function test_dashboard_recalibration_returns_403_for_client(): void
    {
        $response = $this->actingAs($this->client)
            ->getJson('/api/v1/admin/dashboard/recalibration');

        $response->assertStatus(403);
    }
}
