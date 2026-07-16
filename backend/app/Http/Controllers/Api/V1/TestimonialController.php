<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Testimonial\StoreTestimonialRequest;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    /**
     * List approved testimonials.
     *
     * GET /testimonials
     */
    public function index(Request $request): JsonResponse
    {
        $testimonials = Testimonial::where('status', 'approved')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $testimonials,
        ]);
    }

    /**
     * Create a testimonial (status defaults to pending).
     *
     * POST /testimonials
     */
    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $testimonial = Testimonial::create([
            'client_name' => $validated['client_name'],
            'company_role' => $validated['company_role'] ?? null,
            'content' => $validated['content'],
            'rating' => $validated['rating'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => $testimonial,
        ], 201);
    }
}
