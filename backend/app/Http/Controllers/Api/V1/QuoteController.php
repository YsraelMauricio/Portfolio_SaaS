<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\CalculateQuoteRequest;
use App\Http\Requests\Quote\SaveQuoteRequest;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\ProductType;
use App\Models\Quote;
use App\Models\ServiceCategory;
use App\Models\Setting;
use App\Services\Quotes\QuoteCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QuoteController extends Controller
{
    /**
     * List active service categories with their product types count.
     */
    public function categories(): JsonResponse
    {
        $categories = ServiceCategory::active()
            ->orderBy('sort_order')
            ->withCount('productTypes')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * List active product types, optionally filtered by category.
     */
    public function productTypes(Request $request): JsonResponse
    {
        $query = ProductType::active()
            ->with('category:id,name,slug')
            ->orderBy('sort_order');

        if ($request->filled('category_id')) {
            $query->where('service_category_id', $request->input('category_id'));
        }

        $productTypes = $query->get();

        return response()->json([
            'data' => $productTypes,
        ]);
    }

    /**
     * List modifier groups with their modifiers for a given product type.
     * Includes global modifier groups (product_type_id = null).
     */
    public function modifiers(Request $request): JsonResponse
    {
        $request->validate([
            'product_type_id' => ['required', 'integer', 'exists:product_types,id'],
        ]);

        $productTypeId = $request->input('product_type_id');

        // Get groups specific to this product type OR global groups
        $groups = ModifierGroup::where(function ($query) use ($productTypeId) {
            $query->where('product_type_id', $productTypeId)
                ->orWhereNull('product_type_id');
        })
            ->orderBy('sort_order')
            ->with(['modifiers' => function ($query) {
                $query->where('active', true)->orderBy('sort_order');
            }])
            ->get();

        return response()->json([
            'data' => $groups,
        ]);
    }

    /**
     * Calculate estimated price and time for a product type + modifier selection.
     */
    public function calculate(CalculateQuoteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $calculator = new QuoteCalculator;
        $result = $calculator->calculate(
            (int) $validated['product_type_id'],
            $validated['modifier_ids'] ?? []
        );

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Get the next available start date from settings.
     */
    public function nextAvailableStartDate(): JsonResponse
    {
        $value = Setting::get('next_available_start_date');

        if (! $value) {
            $value = 'As soon as possible — typically within 2 weeks';
        }

        return response()->json([
            'data' => [
                'next_available_start_date' => $value,
            ],
        ]);
    }

    /**
     * Save a quote for the authenticated user.
     */
    public function save(SaveQuoteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $calculator = new QuoteCalculator;
        $result = $calculator->calculate(
            (int) $validated['product_type_id'],
            $validated['modifier_ids'] ?? []
        );

        /** @var \App\Models\User $user */
        $user = $request->user();

        $quote = Quote::create([
            'user_id' => $user->id,
            'product_type_id' => $validated['product_type_id'],
            'estimated_price_min' => $result['estimated_price_min'],
            'estimated_price_max' => $result['estimated_price_max'],
            'estimated_days_min' => $result['estimated_days_min'],
            'estimated_days_max' => $result['estimated_days_max'],
            'currency' => $validated['currency'] ?? 'USD',
            'status' => 'saved',
            'is_test' => false,
            'locale' => $validated['locale'] ?? app()->getLocale(),
        ]);

        // Attach modifiers via pivot
        if (! empty($validated['modifier_ids'])) {
            $quote->modifiers()->attach($validated['modifier_ids']);
        }

        $quote->load(['productType', 'modifiers']);

        return response()->json([
            'data' => $quote,
        ], 201);
    }

    /**
     * Get all quotes for the authenticated user.
     */
    public function mine(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $quotes = $user->quotes()
            ->with(['productType', 'modifiers'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $quotes,
        ]);
    }

    /**
     * Send a quote as a lead (changes status to sent_as_lead and notifies admin).
     */
    public function sendAsLead(Request $request, int $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $quote = Quote::findOrFail($id);

        // Ensure the quote belongs to the authenticated user
        if ($quote->user_id !== $user->id) {
            return response()->json([
                'errors' => ['quote' => ['Quote not found.']],
            ], 404);
        }

        if ($quote->status === 'sent_as_lead') {
            return response()->json([
                'errors' => ['quote' => ['This quote has already been sent as a lead.']],
            ], 422);
        }

        $quote->status = 'sent_as_lead';
        $quote->save();

        // Log the notification (placeholder for real notification system)
        Log::info('Quote sent as lead', [
            'quote_id' => $quote->id,
            'user_id' => $user->id,
            'product_type_id' => $quote->product_type_id,
            'estimated_price_min' => $quote->estimated_price_min,
            'estimated_price_max' => $quote->estimated_price_max,
        ]);

        $quote->load(['productType', 'modifiers']);

        return response()->json([
            'data' => $quote,
        ]);
    }
}
