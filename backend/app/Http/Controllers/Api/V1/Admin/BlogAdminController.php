<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\ModerateCommentRequest;
use App\Http\Requests\Blog\StoreBlogPostRequest;
use App\Http\Requests\Blog\UpdateBlogPostRequest;
use App\Models\BlogComment;
use App\Models\BlogPost;
use App\Models\BlogPostTranslation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogAdminController extends Controller
{
    /**
     * List all blog posts (including drafts and soft-deleted).
     *
     * GET /admin/blog/posts
     */
    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::withTrashed()->with(['translations', 'author:id,name']);

        // Filter by locale if provided
        if ($locale = $request->query('locale')) {
            $query->whereHas('translations', function ($q) use ($locale) {
                $q->where('locale', $locale);
            });
        }

        $posts = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'data' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    /**
     * Store a new blog post with translations and optional featured image.
     *
     * POST /admin/blog/posts
     */
    public function store(StoreBlogPostRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $post = BlogPost::create([
            'author_id' => $request->user()->id,
            'slug' => $validated['slug'],
            'pillar' => $validated['pillar'],
            'status' => $validated['status'],
            'published_at' => $validated['published_at'] ?? now(),
        ]);

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            $media = $post->addMediaFromRequest('featured_image')->toMediaCollection('featured_image');
            $post->update(['featured_image_media_id' => $media->id]);
        }

        // Create translations
        foreach ($validated['translations'] as $translationData) {
            $post->translations()->create($translationData);
        }

        return response()->json([
            'data' => $post->load(['translations', 'author:id,name']),
        ], 201);
    }

    /**
     * Show a single blog post (including soft-deleted).
     *
     * GET /admin/blog/posts/{id}
     */
    public function show(int $id): JsonResponse
    {
        $post = BlogPost::withTrashed()
            ->with(['translations', 'author:id,name', 'comments.user:id,name'])
            ->findOrFail($id);

        return response()->json([
            'data' => $post,
        ]);
    }

    /**
     * Update a blog post.
     *
     * PATCH /admin/blog/posts/{id}
     */
    public function update(UpdateBlogPostRequest $request, int $id): JsonResponse
    {
        $post = BlogPost::withTrashed()->findOrFail($id);
        $validated = $request->validated();

        // Update core fields
        $updateData = array_filter([
            'slug' => $validated['slug'] ?? null,
            'pillar' => $validated['pillar'] ?? null,
            'status' => $validated['status'] ?? null,
            'published_at' => $validated['published_at'] ?? $post->published_at,
        ], fn ($value) => $value !== null);

        $post->update($updateData);

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            $post->clearMediaCollection('featured_image');
            $media = $post->addMediaFromRequest('featured_image')->toMediaCollection('featured_image');
            $post->update(['featured_image_media_id' => $media->id]);
        }

        // Update translations
        if (isset($validated['translations'])) {
            foreach ($validated['translations'] as $translationData) {
                BlogPostTranslation::updateOrCreate(
                    [
                        'blog_post_id' => $post->id,
                        'locale' => $translationData['locale'],
                    ],
                    $translationData
                );
            }
        }

        return response()->json([
            'data' => $post->fresh()->load(['translations', 'author:id,name']),
        ]);
    }

    /**
     * Soft-delete a blog post.
     *
     * DELETE /admin/blog/posts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $post = BlogPost::findOrFail($id);
        $post->delete();

        return response()->json(null, 204);
    }

    /**
     * Moderate a blog comment.
     *
     * PATCH /admin/blog/comments/{id}/moderate
     */
    public function moderateComment(ModerateCommentRequest $request, int $id): JsonResponse
    {
        $comment = BlogComment::findOrFail($id);
        $comment->update(['status' => $request->validated('status')]);

        return response()->json([
            'data' => $comment->load('user:id,name'),
        ]);
    }
}
