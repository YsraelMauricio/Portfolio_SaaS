<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PortfolioProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    /**
     * List portfolio projects, filtered by tag and locale.
     *
     * GET /portfolio?tag=&locale=
     */
    public function index(Request $request): JsonResponse
    {
        $locale = $request->query('locale', 'en');
        $tag = $request->query('tag');

        $query = PortfolioProject::with(['translations' => function ($query) use ($locale) {
            $query->where('locale', $locale);
        }])->orderBy('sort_order');

        if ($tag) {
            $query->whereJsonContains('technologies', $tag);
        }

        $projects = $query->get();

        return response()->json([
            'data' => $projects,
        ]);
    }

    /**
     * Show a single portfolio project by slug.
     *
     * GET /portfolio/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $project = PortfolioProject::where('slug', $slug)
            ->with('translations')
            ->first();

        if (! $project) {
            return response()->json([
                'data' => null,
                'errors' => ['Portfolio project not found.'],
            ], 404);
        }

        return response()->json([
            'data' => $project,
        ]);
    }
}
