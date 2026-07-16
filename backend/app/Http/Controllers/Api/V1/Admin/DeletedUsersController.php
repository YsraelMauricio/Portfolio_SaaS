<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DeletedUsersController extends Controller
{
    /**
     * Return users inside the retention window.
     *
     * GET /admin/deleted-users
     *
     * Returns users with deleted_at NOT NULL and anonymized_at NULL
     * (still inside retention window, not yet fully anonymized).
     * Only shows basic info needed for admin review — no sensitive PII.
     */
    public function index(): JsonResponse
    {
        $users = User::onlyTrashed()
            ->whereNull('anonymized_at')
            ->orderBy('deleted_at', 'desc')
            ->get([
                'id',
                'name',
                'email',
                'deleted_at',
                'exit_survey_reason',
                'created_at',
            ]);

        return response()->json([
            'data' => $users,
        ]);
    }
}
