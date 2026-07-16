<?php

namespace Tests\Feature;

use App\Models\BlogComment;
use App\Models\BlogPost;
use App\Models\BlogPostTranslation;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private BlogPost $publishedPost;

    private BlogPost $draftPost;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        // Create a published post
        $this->publishedPost = BlogPost::create([
            'author_id' => $this->admin->id,
            'slug' => 'test-post',
            'pillar' => 'educational',
            'status' => 'published',
            'published_at' => now(),
        ]);

        BlogPostTranslation::create([
            'blog_post_id' => $this->publishedPost->id,
            'locale' => 'en',
            'title' => 'Test Post Title',
            'summary' => 'Test summary',
            'content' => 'Test content body',
            'meta_title' => 'Test Meta',
            'meta_description' => 'Test description',
        ]);

        BlogPostTranslation::create([
            'blog_post_id' => $this->publishedPost->id,
            'locale' => 'es',
            'title' => 'Título del Post',
            'summary' => 'Resumen de prueba',
            'content' => 'Contenido de prueba',
        ]);

        // Create a draft post
        $this->draftPost = BlogPost::create([
            'author_id' => $this->admin->id,
            'slug' => 'draft-post',
            'pillar' => 'tutorial',
            'status' => 'draft',
        ]);

        BlogPostTranslation::create([
            'blog_post_id' => $this->draftPost->id,
            'locale' => 'en',
            'title' => 'Draft Post',
            'summary' => 'Not published yet',
            'content' => 'Draft content',
        ]);

        Storage::fake('public');
    }

    // ─── Public: GET /blog/posts ────────────────────────────────────────────

    public function test_public_can_list_published_blog_posts(): void
    {
        $response = $this->getJson('/api/v1/blog/posts');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'slug',
                    'pillar',
                    'status',
                    'translations',
                    'author',
                ],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
        $response->assertJsonCount(1, 'data'); // Only 1 published
    }

    public function test_public_can_filter_blog_posts_by_pillar(): void
    {
        $response = $this->getJson('/api/v1/blog/posts?pillar=educational');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');

        $response = $this->getJson('/api/v1/blog/posts?pillar=case_study');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }

    public function test_public_can_filter_blog_posts_by_locale(): void
    {
        $response = $this->getJson('/api/v1/blog/posts?locale=es');

        $response->assertStatus(200);
        $this->assertEquals('Título del Post', $response->json('data.0.translations.0.title'));
    }

    public function test_draft_posts_are_not_in_public_list(): void
    {
        $response = $this->getJson('/api/v1/blog/posts');

        $response->assertStatus(200);
        $response->assertJsonMissing(['slug' => 'draft-post']);
    }

    // ─── Public: GET /blog/posts/{slug} ──────────────────────────────────────

    public function test_public_can_view_published_blog_post_by_slug(): void
    {
        $response = $this->getJson('/api/v1/blog/posts/test-post');

        $response->assertStatus(200);
        $response->assertJsonPath('data.slug', 'test-post');
        $response->assertJsonPath('data.status', 'published');
    }

    public function test_public_cannot_view_draft_post_by_slug(): void
    {
        $response = $this->getJson('/api/v1/blog/posts/draft-post');

        $response->assertStatus(404);
    }

    public function test_public_viewing_post_gets_only_approved_comments(): void
    {
        // Create approved comment
        BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Approved comment',
            'status' => 'approved',
        ]);

        // Create pending and rejected comments
        BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Pending comment',
            'status' => 'pending',
        ]);

        BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Rejected comment',
            'status' => 'rejected',
        ]);

        $response = $this->getJson('/api/v1/blog/posts/test-post');

        $response->assertStatus(200);
        $comments = $response->json('data.comments');
        $this->assertCount(1, $comments);
        $this->assertEquals('Approved comment', $comments[0]['content']);
    }

    // ─── Authenticated: POST /blog/posts/{id}/comments ─────────────────────

    public function test_authenticated_user_can_comment(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson("/api/v1/blog/posts/{$this->publishedPost->id}/comments", [
                'content' => 'Great article!',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.content', 'Great article!');
    }

    public function test_unauthenticated_user_cannot_comment(): void
    {
        $response = $this->postJson("/api/v1/blog/posts/{$this->publishedPost->id}/comments", [
            'content' => 'Great article!',
        ]);

        $response->assertStatus(401);
    }

    public function test_comment_requires_content(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson("/api/v1/blog/posts/{$this->publishedPost->id}/comments", []);

        $response->assertStatus(422);
    }

    // ─── Admin: CRUD ───────────────────────────────────────────────────────

    public function test_admin_can_list_all_posts_including_drafts(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/blog/posts');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data'); // Both published + draft
    }

    public function test_admin_can_create_post(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/blog/posts', [
                'slug' => 'new-post',
                'pillar' => 'case_study',
                'status' => 'published',
                'published_at' => now()->toDateTimeString(),
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'New Post',
                        'summary' => 'New summary',
                        'content' => 'New content',
                        'meta_title' => 'New Meta',
                        'meta_description' => 'New description',
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.slug', 'new-post');
        $this->assertDatabaseHas('blog_posts', ['slug' => 'new-post']);
    }

    public function test_admin_can_create_post_with_featured_image(): void
    {
        $file = UploadedFile::fake()->image('featured.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/blog/posts', [
                'slug' => 'post-with-image',
                'pillar' => 'tutorial',
                'status' => 'published',
                'featured_image' => $file,
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'Post With Image',
                        'summary' => 'Image summary',
                        'content' => 'Image content',
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('data.featured_image_media_id'));
    }

    public function test_admin_can_view_single_post(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/blog/posts/'.$this->publishedPost->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $this->publishedPost->id);
    }

    public function test_admin_can_update_post(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/blog/posts/'.$this->publishedPost->id, [
                'slug' => 'updated-slug',
                'translations' => [
                    [
                        'locale' => 'en',
                        'title' => 'Updated Title',
                        'summary' => 'Updated summary',
                        'content' => 'Updated content',
                    ],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('blog_posts', ['slug' => 'updated-slug']);
        $this->assertDatabaseHas('blog_post_translations', [
            'blog_post_id' => $this->publishedPost->id,
            'locale' => 'en',
            'title' => 'Updated Title',
        ]);
    }

    public function test_admin_can_soft_delete_post(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/blog/posts/'.$this->publishedPost->id);

        $response->assertStatus(204);
        $this->assertSoftDeleted('blog_posts', ['id' => $this->publishedPost->id]);
    }

    public function test_non_admin_cannot_manage_blog_posts(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/admin/blog/posts', [
                'slug' => 'unauthorized',
                'pillar' => 'educational',
                'status' => 'draft',
                'translations' => [
                    ['locale' => 'en', 'title' => 'Nope', 'summary' => 'No', 'content' => 'Nah'],
                ],
            ]);

        $response->assertStatus(403);
    }

    // ─── Admin: Comment moderation ──────────────────────────────────────────

    public function test_admin_can_moderate_comment(): void
    {
        $comment = BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Needs moderation',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/blog/comments/{$comment->id}/moderate", [
                'status' => 'approved',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('blog_comments', [
            'id' => $comment->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_reject_comment(): void
    {
        $comment = BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Spam',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/blog/comments/{$comment->id}/moderate", [
                'status' => 'rejected',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('blog_comments', [
            'id' => $comment->id,
            'status' => 'rejected',
        ]);
    }

    public function test_moderate_comment_validates_status(): void
    {
        $comment = BlogComment::create([
            'blog_post_id' => $this->publishedPost->id,
            'user_id' => $this->client->id,
            'content' => 'Test',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/blog/comments/{$comment->id}/moderate", [
                'status' => 'invalid-status',
            ]);

        $response->assertStatus(422);
    }
}
