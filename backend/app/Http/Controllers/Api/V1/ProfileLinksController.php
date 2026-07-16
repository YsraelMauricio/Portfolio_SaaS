<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfileLinksRequest;
use App\Models\ProfileLink;
use Illuminate\Http\JsonResponse;

class ProfileLinksController extends Controller
{
    /**
     * Return only visible profile links, ordered.
     *
     * GET /profile-links
     */
    public function index(): JsonResponse
    {
        $links = ProfileLink::where('visible', true)
            ->orderBy('sort_order')
            ->get(['id', 'key', 'url', 'visible', 'sort_order']);

        return response()->json([
            'data' => $links,
        ]);
    }

    /**
     * Update profile links.
     *
     * PATCH /admin/profile-links
     */
    public function update(UpdateProfileLinksRequest $request): JsonResponse
    {
        $links = $request->validated('links');

        foreach ($links as $linkData) {
            ProfileLink::where('id', $linkData['id'])->update([
                'url' => $linkData['url'],
                'visible' => $linkData['visible'],
                'sort_order' => $linkData['sort_order'],
            ]);
        }

        $updatedLinks = ProfileLink::orderBy('sort_order')->get();

        return response()->json([
            'data' => $updatedLinks,
        ]);
    }
}
