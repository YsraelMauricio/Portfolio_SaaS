<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;

class TestimonialAdminController extends Controller
{
    /**
     * Approve a testimonial.
     *
     * PATCH /admin/testimonials/{id}/approve
     */
    public function approve(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->update(['status' => 'approved']);

        return response()->json([
            'data' => $testimonial,
        ]);
    }

    /**
     * Reject a testimonial.
     *
     * PATCH /admin/testimonials/{id}/reject
     */
    public function reject(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->update(['status' => 'rejected']);

        return response()->json([
            'data' => $testimonial,
        ]);
    }
}
