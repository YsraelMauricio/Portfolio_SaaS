<?php

namespace Tests\Feature;

use App\Models\PortfolioProject;
use App\Models\PortfolioProjectTranslation;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PortfolioApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private PortfolioProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        $this->project = PortfolioProject::create([
            'slug' => 'my-project',
            'technologies' => ['Laravel', 'Next.js', 'AI'],
            'demo_url' => 'https://demo.example.com',
            'repo_url' => 'https://github.com/example/repo',
            'is_this_platform' => false,
            'sort_order' => 1,
        ]);

        PortfolioProjectTranslation::create([
            'portfolio_project_id' => $this->project->id,
            'locale' => 'en',
            'title' => 'My Project',
            'description' => 'A great project built with Laravel and Next.js.',
            'key_result' => '+50% efficiency',
        ]);

        PortfolioProjectTranslation::create([
            'portfolio_project_id' => $this->project->id,
            'locale' => 'es',
            'title' => 'Mi Proyecto',
            'description' => 'Un gran proyecto construido con Laravel y Next.js.',
            'key_result' => '+50% eficiencia',
        ]);

        Storage::fake('public');
    }

    // ─── Public: GET /portfolio ─────────────────────────────────────────────

    public function test_public_can_list_portfolio_projects(): void
    {
        $response = $this->getJson('/api/v1/portfolio');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'slug',
                    'technologies',
                    'translations',
                ],
            ],
        ]);
        $response->assertJsonCount(1, 'data');
    }

    public function test_public_can_filter_portfolio_by_tag(): void
    {
        $response = $this->getJson('/api/v1/portfolio?tag=Laravel');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');

        $response = $this->getJson('/api/v1/portfolio?tag=React');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }

    public function test_public_can_filter_portfolio_by_locale(): void
    {
        $response = $this->getJson('/api/v1/portfolio?locale=es');

        $response->assertStatus(200);
        $this->assertEquals('Mi Proyecto', $response->json('data.0.translations.0.title'));
    }

    public function test_portfolio_projects_are_sorted_by_sort_order(): void
    {
        PortfolioProject::create([
            'slug' => 'second-project',
            'technologies' => ['Python'],
            'sort_order' => 2,
        ]);
        PortfolioProjectTranslation::create([
            'portfolio_project_id' => 2,
            'locale' => 'en',
            'title' => 'Second Project',
            'description' => 'Second desc',
        ]);

        $response = $this->getJson('/api/v1/portfolio');

        $response->assertStatus(200);
        $this->assertEquals('my-project', $response->json('data.0.slug'));
        $this->assertEquals('second-project', $response->json('data.1.slug'));
    }

    // ─── Public: GET /portfolio/{slug} ──────────────────────────────────────

    public function test_public_can_view_portfolio_project_by_slug(): void
    {
        $response = $this->getJson('/api/v1/portfolio/my-project');

        $response->assertStatus(200);
        $response->assertJsonPath('data.slug', 'my-project');
    }

    public function test_public_gets_404_for_nonexistent_portfolio_slug(): void
    {
        $response = $this->getJson('/api/v1/portfolio/non-existent');

        $response->assertStatus(404);
    }

    // ─── Admin: CRUD ───────────────────────────────────────────────────────

    public function test_admin_can_list_all_portfolio_projects(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/portfolio');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_admin_can_create_portfolio_project(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/portfolio', [
                'slug' => 'new-project',
                'technologies' => ['Vue.js', 'Tailwind'],
                'demo_url' => 'https://demo.new.com',
                'is_this_platform' => false,
                'sort_order' => 3,
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'New Project',
                        'description' => 'Brand new project description.',
                        'key_result' => '2x speed',
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.slug', 'new-project');
        $this->assertDatabaseHas('portfolio_projects', ['slug' => 'new-project']);
    }

    public function test_admin_can_create_portfolio_project_with_image(): void
    {
        $file = UploadedFile::fake()->image('portfolio.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/portfolio', [
                'slug' => 'project-with-image',
                'technologies' => ['React'],
                'sort_order' => 4,
                'featured_image' => $file,
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'Project With Image',
                        'description' => 'Has featured image',
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('data.featured_image_media_id'));
    }

    public function test_admin_can_view_single_portfolio_project(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/portfolio/'.$this->project->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $this->project->id);
    }

    public function test_admin_can_update_portfolio_project(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/portfolio/'.$this->project->id, [
                'slug' => 'updated-project-slug',
                'technologies' => ['Laravel', 'React'],
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'Updated Title',
                        'description' => 'Updated description',
                        'key_result' => '3x faster',
                    ],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('portfolio_projects', ['slug' => 'updated-project-slug']);
        $this->assertDatabaseHas('portfolio_project_translations', [
            'portfolio_project_id' => $this->project->id,
            'locale' => 'en',
            'title' => 'Updated Title',
        ]);
    }

    public function test_admin_can_soft_delete_portfolio_project(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/portfolio/'.$this->project->id);

        $response->assertStatus(204);
        $this->assertSoftDeleted('portfolio_projects', ['id' => $this->project->id]);
    }

    public function test_non_admin_cannot_manage_portfolio(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/admin/portfolio', [
                'slug' => 'unauthorized',
                'sort_order' => 1,
                'translations' => [
                    ['locale' => 'en', 'title' => 'Nope', 'description' => 'No'],
                ],
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_create_portfolio_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/portfolio', []);

        $response->assertStatus(422);
    }
}
