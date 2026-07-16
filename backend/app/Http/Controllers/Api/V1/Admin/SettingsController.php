<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Safe-to-expose public setting keys.
     */
    private const PUBLIC_KEYS = [
        'contact_email',
        'contact_phone',
        'next_available_start_date',
    ];

    /**
     * Return ALL settings as key-value pairs.
     *
     * GET /admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * Update settings (accepts a JSON object of key-value pairs).
     *
     * PATCH /admin/settings
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settings = $request->validatedSettings();

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Invalidate the Redis cache
        Cache::tags(['settings'])->flush();

        $updatedSettings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'data' => $updatedSettings,
        ]);
    }

    /**
     * Return only the safe-to-expose subset of settings.
     *
     * GET /settings/public
     */
    public function public(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::PUBLIC_KEYS)
            ->get()
            ->pluck('value', 'key');

        return response()->json([
            'data' => $settings,
        ]);
    }
}
