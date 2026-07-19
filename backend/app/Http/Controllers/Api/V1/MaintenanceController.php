<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MaintenancePlan;
use App\Models\MaintenanceSubscription;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function plans()
    {
        return response()->json([
            'data' => MaintenancePlan::where('active', true)->get(),
        ]);
    }

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:maintenance_plans,id',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $subscription = MaintenanceSubscription::create([
            'user_id' => $request->user()->id,
            'plan_id' => $validated['plan_id'],
            'billing_cycle' => $validated['billing_cycle'],
            'status' => 'active',
            'start_date' => now(),
            'next_billing_date' => $validated['billing_cycle'] === 'monthly'
                ? now()->addMonth()
                : now()->addYear(),
        ]);

        return response()->json(['data' => $subscription], 201);
    }

    public function cancel(MaintenanceSubscription $subscription)
    {
        $this->authorize('update', $subscription);
        $subscription->update(['status' => 'cancelled']);

        return response()->json(['data' => $subscription]);
    }

    public function pause(MaintenanceSubscription $subscription)
    {
        $this->authorize('update', $subscription);
        $subscription->update(['status' => 'paused']);

        return response()->json(['data' => $subscription]);
    }
}
