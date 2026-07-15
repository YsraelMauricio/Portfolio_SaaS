<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // OAuth routes (public — redirect & callback)
    Route::get('/auth/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::get('/auth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/user', [AuthController::class, 'user']);

        // Account management
        Route::get('/account/export', [AuthController::class, 'exportAccount']);
        Route::delete('/account', [AuthController::class, 'destroyAccount']);

        // Admin-only 2FA enrollment (no 2fa middleware — these routes are used to enable 2FA)
        Route::middleware('role:admin')->group(function () {
            Route::post('/auth/2fa/enable', [AuthController::class, 'enable2FA']);
            Route::post('/auth/2fa/verify', [AuthController::class, 'verify2FA']);
        });

        // Future admin-only routes requiring 2FA already enabled go here
        // Route::middleware(['role:admin', '2fa'])->group(function () { ... });
    });
});
