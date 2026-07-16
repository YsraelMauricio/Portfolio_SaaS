<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Quote;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Return precomputed dashboard metrics.
     *
     * GET /admin/dashboard/metrics
     */
    public function metrics(): JsonResponse
    {
        // Total active projects by status (exclude is_test)
        $projectsByStatus = Project::where('is_test', false)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        // Total revenue: sum of payments where status=confirmed, is_test=false
        $totalRevenue = Payment::where('is_test', false)
            ->where('status', 'confirmed')
            ->sum('amount_usd');

        // Pending contracts (draft or approved_pending_send, is_test=false)
        $pendingContracts = Contract::where('is_test', false)
            ->whereIn('status', ['draft', 'approved_pending_send'])
            ->count();

        // New leads this month: quotes with status=sent_as_lead, is_test=false, this month
        $newLeadsThisMonth = Quote::where('is_test', false)
            ->where('status', 'sent_as_lead')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Average project delivery time: for delivered projects with actual_delivery_date
        // and actual_start_date (not test projects)
        // Calculated in PHP for cross-database compatibility (DATEDIFF is DB-specific)
        $deliveredProjects = Project::where('is_test', false)
            ->where('status', 'delivered')
            ->whereNotNull('actual_start_date')
            ->whereNotNull('actual_delivery_date')
            ->get(['actual_start_date', 'actual_delivery_date']);

        $avgDeliveryDays = null;

        if ($deliveredProjects->isNotEmpty()) {
            $totalDays = $deliveredProjects->sum(function ($project) {
                return $project->actual_start_date->diffInDays($project->actual_delivery_date);
            });
            $avgDeliveryDays = round($totalDays / $deliveredProjects->count(), 1);
        }

        return response()->json([
            'data' => [
                'projects_by_status' => $projectsByStatus,
                'total_revenue' => (float) $totalRevenue,
                'pending_contracts' => $pendingContracts,
                'new_leads_this_month' => $newLeadsThisMonth,
                'average_delivery_days' => $avgDeliveryDays ? round((float) $avgDeliveryDays, 1) : null,
            ],
        ]);
    }

    /**
     * Return quoted-vs-actual comparison by category.
     *
     * GET /admin/dashboard/recalibration
     *
     * For delivered projects where scope_changed = false, compare the
     * confirmed_delivery_date to actual_delivery_date and the quote_snapshot
     * to actuals. Return the list of highest-deviation projects.
     */
    public function recalibration(): JsonResponse
    {
        $projects = Project::where('is_test', false)
            ->where('status', 'delivered')
            ->where('scope_changed', false)
            ->whereNotNull('actual_delivery_date')
            ->whereNotNull('confirmed_delivery_date')
            ->with(['contracts' => function ($query) {
                $query->where('status', 'signed')
                    ->orderBy('signed_at', 'desc');
            }])
            ->get();

        $comparisons = [];

        foreach ($projects as $project) {
            $signedContract = $project->contracts->first();

            if (! $signedContract || ! $signedContract->quote_snapshot) {
                continue;
            }

            $snapshot = $signedContract->quote_snapshot;

            // Calculate delivery deviation in days
            $confirmedDate = Carbon::parse($project->confirmed_delivery_date);
            $actualDate = Carbon::parse($project->actual_delivery_date);
            $deviationDays = $confirmedDate->diffInDays($actualDate, false); // negative = early, positive = late

            $comparisons[] = [
                'project_id' => $project->id,
                'product_type_name' => $snapshot['product_type_name'] ?? 'Unknown',
                'quoted_price' => (float) ($snapshot['price_usd'] ?? 0),
                'confirmed_delivery_date' => $project->confirmed_delivery_date->format('Y-m-d'),
                'actual_delivery_date' => $project->actual_delivery_date->format('Y-m-d'),
                'deviation_days' => $deviationDays,
            ];
        }

        // Sort by absolute deviation (highest first)
        usort($comparisons, function ($a, $b) {
            return abs($b['deviation_days']) <=> abs($a['deviation_days']);
        });

        return response()->json([
            'data' => $comparisons,
        ]);
    }
}
