<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\StoreCategoryRequest;
use App\Http\Requests\Quote\StoreModifierGroupRequest;
use App\Http\Requests\Quote\StoreModifierRequest;
use App\Http\Requests\Quote\StoreProductTypeRequest;
use App\Http\Requests\Quote\UpdateCategoryRequest;
use App\Http\Requests\Quote\UpdateModifierGroupRequest;
use App\Http\Requests\Quote\UpdateModifierRequest;
use App\Http\Requests\Quote\UpdateProductTypeRequest;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\PriceChangeHistory;
use App\Models\ProductType;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteAdminController extends Controller
{
    // ─── Service Categories ───────────────────────────────────────────────────

    /**
     * List all service categories (including inactive).
     */
    public function indexCategories(): JsonResponse
    {
        $categories = ServiceCategory::orderBy('sort_order')
            ->withCount('productTypes')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Create a new service category.
     */
    public function storeCategory(StoreCategoryRequest $request): JsonResponse
    {
        $category = ServiceCategory::create($request->validated());

        return response()->json([
            'data' => $category,
        ], 201);
    }

    /**
     * Update a service category (PATCH — partial update, no hard delete).
     */
    public function updateCategory(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = ServiceCategory::findOrFail($id);
        $category->update($request->validated());

        return response()->json([
            'data' => $category->fresh(),
        ]);
    }

    // ─── Product Types ────────────────────────────────────────────────────────

    /**
     * List all product types (including inactive).
     */
    public function indexProductTypes(): JsonResponse
    {
        $productTypes = ProductType::with('category:id,name')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $productTypes,
        ]);
    }

    /**
     * Create a new product type.
     */
    public function storeProductType(StoreProductTypeRequest $request): JsonResponse
    {
        $productType = ProductType::create($request->validated());

        return response()->json([
            'data' => $productType->load('category:id,name'),
        ], 201);
    }

    /**
     * Update a product type (PATCH — partial update, no hard delete).
     */
    public function updateProductType(UpdateProductTypeRequest $request, int $id): JsonResponse
    {
        $productType = ProductType::findOrFail($id);
        $productType->update($request->validated());

        return response()->json([
            'data' => $productType->fresh()->load('category:id,name'),
        ]);
    }

    // ─── Modifier Groups ──────────────────────────────────────────────────────

    /**
     * List all modifier groups (with modifiers).
     */
    public function indexModifierGroups(): JsonResponse
    {
        $groups = ModifierGroup::with(['modifiers' => function ($query) {
            $query->orderBy('sort_order');
        }])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $groups,
        ]);
    }

    /**
     * Create a new modifier group.
     */
    public function storeModifierGroup(StoreModifierGroupRequest $request): JsonResponse
    {
        $group = ModifierGroup::create($request->validated());

        return response()->json([
            'data' => $group,
        ], 201);
    }

    /**
     * Update a modifier group (PATCH — partial update, no hard delete).
     */
    public function updateModifierGroup(UpdateModifierGroupRequest $request, int $id): JsonResponse
    {
        $group = ModifierGroup::findOrFail($id);
        $group->update($request->validated());

        return response()->json([
            'data' => $group->fresh(),
        ]);
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    /**
     * List all modifiers.
     */
    public function indexModifiers(): JsonResponse
    {
        $modifiers = Modifier::with('modifierGroup')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $modifiers,
        ]);
    }

    /**
     * Create a new modifier.
     */
    public function storeModifier(StoreModifierRequest $request): JsonResponse
    {
        $modifier = Modifier::create($request->validated());

        return response()->json([
            'data' => $modifier->load('modifierGroup'),
        ], 201);
    }

    /**
     * Update a modifier (PATCH — partial update, no hard delete).
     * Changing price_impact_usd or time_impact_days automatically creates
     * a row in price_change_history.
     */
    public function updateModifier(UpdateModifierRequest $request, int $id): JsonResponse
    {
        $modifier = Modifier::findOrFail($id);
        $validated = $request->validated();

        // Check if price or time impact is being changed
        $hasPriceChange = array_key_exists('price_impact_usd', $validated)
            && $validated['price_impact_usd'] != $modifier->price_impact_usd;
        $hasTimeChange = array_key_exists('time_impact_days', $validated)
            && $validated['time_impact_days'] != $modifier->time_impact_days;

        if ($hasPriceChange || $hasTimeChange) {
            // Determine which value changed
            if ($hasPriceChange) {
                PriceChangeHistory::create([
                    'changeable_type' => Modifier::class,
                    'changeable_id' => $modifier->id,
                    'old_value' => $modifier->price_impact_usd,
                    'new_value' => $validated['price_impact_usd'],
                    'reason' => $validated['reason'] ?? null,
                    'admin_id' => $request->user()->id,
                ]);
            }

            if ($hasTimeChange) {
                PriceChangeHistory::create([
                    'changeable_type' => Modifier::class,
                    'changeable_id' => $modifier->id,
                    'old_value' => $modifier->time_impact_days,
                    'new_value' => $validated['time_impact_days'],
                    'reason' => $validated['reason'] ?? null,
                    'admin_id' => $request->user()->id,
                ]);
            }
        }

        // Remove reason from update data (not a column on modifiers)
        unset($validated['reason']);

        $modifier->update($validated);

        return response()->json([
            'data' => $modifier->fresh()->load('modifierGroup'),
        ]);
    }
}
