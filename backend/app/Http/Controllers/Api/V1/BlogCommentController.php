<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\StoreCommentRequest;
use App\Models\BlogComment;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;

class BlogCommentController extends Controller
{
    /**
     * Store a new comment on a blog post.
     *
     * POST /blog/posts/{id}/comments
     */
    public function store(StoreCommentRequest $request, int $postId): JsonResponse
    {
        $post = BlogPost::findOrFail($postId);

        $comment = BlogComment::create([
            'blog_post_id' => $post->id,
            'user_id' => $request->user()->id,
            'content' => $request->validated('content'),
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => $comment->load('user:id,name'),
        ], 201);
    }
}
