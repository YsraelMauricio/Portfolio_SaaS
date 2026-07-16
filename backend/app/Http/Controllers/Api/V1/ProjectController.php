<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreMilestoneRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     *
     * GET /projects
     * Client sees their own; admin sees all (with ?is_test=false filter by default).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasRole('admin')) {
            $query = Project::with('user:id,name,email');

            // Default filter: is_test = false (can be overridden via ?is_test=)
            if ($request->has('is_test')) {
                $query->where('is_test', filter_var($request->input('is_test'), FILTER_VALIDATE_BOOLEAN));
            } else {
                $query->where('is_test', false);
            }

            $projects = $query->orderBy('created_at', 'desc')->paginate(20);
        } else {
            $projects = $user->projects()
                ->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        }

        return response()->json([
            'data' => $projects->items(),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    /**
     * Display the specified project.
     *
     * GET /projects/{id}
     * Includes milestones. Client can only view their own; admin can view any.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $project = Project::with(['user:id,name,email', 'milestones' => function ($query) {
            $query->orderBy('sort_order');
        }])->findOrFail($id);

        // Ensure client can only view their own project
        if ($project->user_id !== $user->id && ! $user->hasRole('admin')) {
            return response()->json([
                'errors' => ['project' => ['Project not found.']],
            ], 404);
        }

        return response()->json([
            'data' => $project,
        ]);
    }

    /**
     * Update the specified project (partial update).
     *
     * PATCH /admin/projects/{id}
     * Fields: status?, scope_changed?
     * Moving to 'delivered' sets actual_delivery_date.
     * 'cancelled' is valid from any non-terminal status.
     */
    public function update(UpdateProjectRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();

        /** @var Project $project */
        $project = Project::findOrFail($id);

        $updateData = [];

        // Handle status transition
        if (isset($validated['status'])) {
            $newStatus = $validated['status'];

            // Define terminal statuses
            $terminalStatuses = ['delivered', 'cancelled'];

            // Check if transitioning from a terminal status (not allowed)
            if (in_array($project->status, $terminalStatuses, true)) {
                return response()->json([
                    'errors' => ['status' => [
                        'Cannot change status from "'.$project->status.'". Terminal statuses cannot be changed.',
                    ]],
                ], 422);
            }

            // If moving to 'delivered', set actual_delivery_date
            if ($newStatus === 'delivered') {
                $updateData['actual_delivery_date'] = now()->format('Y-m-d');
            }

            $updateData['status'] = $newStatus;
        }

        // Handle scope_changed
        if (isset($validated['scope_changed'])) {
            $updateData['scope_changed'] = filter_var($validated['scope_changed'], FILTER_VALIDATE_BOOLEAN);
        }

        if (! empty($updateData)) {
            $project->update($updateData);
        }

        return response()->json([
            'data' => $project->fresh()->load(['milestones' => function ($query) {
                $query->orderBy('sort_order');
            }]),
        ]);
    }

    /**
     * Store a new milestone for the project.
     *
     * POST /admin/projects/{id}/milestones
     */
    public function storeMilestone(StoreMilestoneRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();

        // Verify the project exists
        $project = Project::findOrFail($id);

        $milestone = ProjectMilestone::create([
            'project_id' => $project->id,
            'name' => $validated['name'],
            'estimated_date' => $validated['estimated_date'],
            'completed_date' => $validated['completed_date'] ?? null,
            'sort_order' => $validated['sort_order'],
        ]);

        return response()->json([
            'data' => $milestone,
        ], 201);
    }

    /**
     * Increment the paused_days counter for the project.
     *
     * PATCH /admin/projects/{id}/pause-clock
     */
    public function pauseClock(Request $request, int $id): JsonResponse
    {
        /** @var Project $project */
        $project = Project::findOrFail($id);

        $project->increment('paused_days');

        return response()->json([
            'data' => [
                'id' => $project->id,
                'paused_days' => $project->fresh()->paused_days,
            ],
        ]);
    }
}
