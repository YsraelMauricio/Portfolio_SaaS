<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaintenancePlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceAdminController extends Controller
{
    /**
     * List all maintenance plans (including inactive).
     */
    public function index(): JsonResponse
    {
        $plans = MaintenancePlan::orderBy('id')->get();

        return response()->json([
            'data' => $plans,
        ]);
    }

    /**
     * Create a new maintenance plan.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'monthly_price_usd' => 'required|numeric|min:0',
            'annual_price_usd' => 'required|numeric|min:0',
            'included_hours_month' => 'required|integer|min:0',
            'response_time_hours' => 'required|integer|min:0',
            'active' => 'boolean',
        ]);

        $plan = MaintenancePlan::create($validated);

        return response()->json([
            'data' => $plan,
        ], 201);
    }

    /**
     * Update a maintenance plan.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $plan = MaintenancePlan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'monthly_price_usd' => 'sometimes|required|numeric|min:0',
            'annual_price_usd' => 'sometimes|required|numeric|min:0',
            'included_hours_month' => 'sometimes|required|integer|min:0',
            'response_time_hours' => 'sometimes|required|integer|min:0',
            'active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);

        return response()->json([
            'data' => $plan->fresh(),
        ]);
    }
}
