<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * List published blog posts with translation for the requested locale.
     *
     * GET /blog/posts?locale=&pillar=
     */
    public function index(Request $request): JsonResponse
    {
        $locale = $request->query('locale', 'en');
        $pillar = $request->query('pillar');

        $query = BlogPost::where('status', 'published')
            ->with(['translations' => function ($query) use ($locale) {
                $query->where('locale', $locale);
            }, 'author:id,name'])
            ->orderByDesc('published_at');

        if ($pillar) {
            $query->where('pillar', $pillar);
        }

        $posts = $query->paginate(12);

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
     * Show a single published blog post by slug.
     *
     * GET /blog/posts/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'published')
            ->with([
                'translations',
                'author:id,name',
                'comments' => function ($query) {
                    $query->where('status', 'approved')
                        ->with('user:id,name')
                        ->orderByDesc('created_at');
                },
            ])
            ->first();

        if (! $post) {
            return response()->json([
                'data' => null,
                'errors' => ['Blog post not found.'],
            ], 404);
        }

        return response()->json([
            'data' => $post,
        ]);
    }
}
