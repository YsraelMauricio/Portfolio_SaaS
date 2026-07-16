<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portfolio\StorePortfolioProjectRequest;
use App\Http\Requests\Portfolio\UpdatePortfolioProjectRequest;
use App\Models\PortfolioProject;
use App\Models\PortfolioProjectTranslation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioAdminController extends Controller
{
    /**
     * List all portfolio projects (including soft-deleted).
     *
     * GET /admin/portfolio
     */
    public function index(Request $request): JsonResponse
    {
        $query = PortfolioProject::withTrashed()->with('translations');

        // Filter by locale if provided
        if ($locale = $request->query('locale')) {
            $query->whereHas('translations', function ($q) use ($locale) {
                $q->where('locale', $locale);
            });
        }

        $projects = $query->orderBy('sort_order')->get();

        return response()->json([
            'data' => $projects,
        ]);
    }

    /**
     * Store a new portfolio project with translations and optional featured image.
     *
     * POST /admin/portfolio
     */
    public function store(StorePortfolioProjectRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $project = PortfolioProject::create([
            'slug' => $validated['slug'],
            'technologies' => $validated['technologies'] ?? [],
            'demo_url' => $validated['demo_url'] ?? null,
            'repo_url' => $validated['repo_url'] ?? null,
            'is_this_platform' => $validated['is_this_platform'] ?? false,
            'sort_order' => $validated['sort_order'],
        ]);

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            $media = $project->addMediaFromRequest('featured_image')->toMediaCollection('featured_image');
            $project->update(['featured_image_media_id' => $media->id]);
        }

        // Create translations
        foreach ($validated['translations'] as $translationData) {
            $project->translations()->create($translationData);
        }

        return response()->json([
            'data' => $project->load('translations'),
        ], 201);
    }

    /**
     * Show a single portfolio project (including soft-deleted).
     *
     * GET /admin/portfolio/{id}
     */
    public function show(int $id): JsonResponse
    {
        $project = PortfolioProject::withTrashed()
            ->with('translations')
            ->findOrFail($id);

        return response()->json([
            'data' => $project,
        ]);
    }

    /**
     * Update a portfolio project.
     *
     * PATCH /admin/portfolio/{id}
     */
    public function update(UpdatePortfolioProjectRequest $request, int $id): JsonResponse
    {
        $project = PortfolioProject::withTrashed()->findOrFail($id);
        $validated = $request->validated();

        // Update core fields
        $updateData = array_filter([
            'slug' => $validated['slug'] ?? null,
            'technologies' => $validated['technologies'] ?? null,
            'demo_url' => $validated['demo_url'] ?? null,
            'repo_url' => $validated['repo_url'] ?? null,
            'is_this_platform' => $validated['is_this_platform'] ?? null,
            'sort_order' => $validated['sort_order'] ?? null,
        ], fn ($value) => $value !== null);

        $project->update($updateData);

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            $project->clearMediaCollection('featured_image');
            $media = $project->addMediaFromRequest('featured_image')->toMediaCollection('featured_image');
            $project->update(['featured_image_media_id' => $media->id]);
        }

        // Update translations
        if (isset($validated['translations'])) {
            foreach ($validated['translations'] as $translationData) {
                PortfolioProjectTranslation::updateOrCreate(
                    [
                        'portfolio_project_id' => $project->id,
                        'locale' => $translationData['locale'],
                    ],
                    $translationData
                );
            }
        }

        return response()->json([
            'data' => $project->fresh()->load('translations'),
        ]);
    }

    /**
     * Soft-delete a portfolio project.
     *
     * DELETE /admin/portfolio/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $project = PortfolioProject::findOrFail($id);
        $project->delete();

        return response()->json(null, 204);
    }
}
