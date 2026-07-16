<?php

use App\Http\Controllers\Api\V1\Admin\BlogAdminController;
use App\Http\Controllers\Api\V1\Admin\CVController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DeletedUsersController;
use App\Http\Controllers\Api\V1\Admin\PortfolioAdminController;
use App\Http\Controllers\Api\V1\Admin\QuoteAdminController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
use App\Http\Controllers\Api\V1\Admin\TestimonialAdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BlogCommentController;
use App\Http\Controllers\Api\V1\BlogController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\DocumensoWebhookController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PortfolioController;
use App\Http\Controllers\Api\V1\ProfileLinksController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\TestimonialController;
use App\Services\Payments\BinancePayProvider;
use App\Services\Payments\OpenBcbProvider;
use App\Services\Payments\PaypalProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // OAuth routes (public — redirect & callback)
    Route::get('/auth/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::get('/auth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

    // Public quote endpoints
    Route::get('/quotes/categories', [QuoteController::class, 'categories']);
    Route::get('/quotes/product-types', [QuoteController::class, 'productTypes']);
    Route::get('/quotes/modifiers', [QuoteController::class, 'modifiers']);
    Route::post('/quotes/calculate', [QuoteController::class, 'calculate'])->middleware('throttle:30,1');
    Route::get('/quotes/next-available-start-date', [QuoteController::class, 'nextAvailableStartDate']);

    // Public — Documenso webhook (signature verified inside the controller)
    Route::post('/webhooks/documenso', [DocumensoWebhookController::class, 'handle']);

    // Public — Settings, CV, and profile links
    Route::get('/settings/public', [SettingsController::class, 'public']);
    Route::get('/cv', [CVController::class, 'metadata']);
    Route::get('/cv/download', [CVController::class, 'download']);
    Route::get('/profile-links', [ProfileLinksController::class, 'index']);

    // Public — Blog
    Route::get('/blog/posts', [BlogController::class, 'index']);
    Route::get('/blog/posts/{slug}', [BlogController::class, 'show']);

    // Public — Portfolio
    Route::get('/portfolio', [PortfolioController::class, 'index']);
    Route::get('/portfolio/{slug}', [PortfolioController::class, 'show']);

    // Public — Testimonials
    Route::get('/testimonials', [TestimonialController::class, 'index']);

    // Payment webhooks (public — signature verification is done inside each provider)
    Route::prefix('webhooks/payments')->group(function () {
        Route::post('/openbcb', function (Request $request) {
            $provider = new OpenBcbProvider;
            if (! $provider->verifyWebhookSignature($request)) {
                return response()->json(['errors' => ['signature' => ['Invalid webhook signature']]], 401);
            }

            return response()->json(['data' => $provider->processWebhook($request)], 200);
        });

        Route::post('/binance', function (Request $request) {
            $provider = new BinancePayProvider;
            if (! $provider->verifyWebhookSignature($request)) {
                return response()->json(['errors' => ['signature' => ['Invalid webhook signature']]], 401);
            }

            return response()->json(['data' => $provider->processWebhook($request)], 200);
        });

        Route::post('/paypal', function (Request $request) {
            $provider = new PaypalProvider;
            if (! $provider->verifyWebhookSignature($request)) {
                return response()->json(['errors' => ['signature' => ['Invalid webhook signature']]], 401);
            }

            return response()->json(['data' => $provider->processWebhook($request)], 200);
        });
    });

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/user', [AuthController::class, 'user']);

        // Account management
        Route::get('/account/export', [AuthController::class, 'exportAccount']);
        Route::delete('/account', [AuthController::class, 'destroyAccount']);

        // Authenticated quote endpoints
        Route::post('/quotes/save', [QuoteController::class, 'save']);
        Route::get('/quotes/mine', [QuoteController::class, 'mine']);
        Route::post('/quotes/{id}/send-as-lead', [QuoteController::class, 'sendAsLead']);

        // Client-facing project and contract views
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::get('/projects/{id}', [ProjectController::class, 'show']);
        Route::get('/contracts/{id}', [ContractController::class, 'show']);

        // Payment initiation
        Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
        Route::post('/payments/{id}/proof', [PaymentController::class, 'uploadProof']);

        // Authenticated — Blog comments
        Route::post('/blog/posts/{id}/comments', [BlogCommentController::class, 'store']);

        // Authenticated — Testimonials
        Route::post('/testimonials', [TestimonialController::class, 'store']);

        // Admin-only 2FA enrollment (no 2fa middleware — these routes are used to enable 2FA)
        Route::middleware('role:admin')->group(function () {
            Route::post('/auth/2fa/enable', [AuthController::class, 'enable2FA']);
            Route::post('/auth/2fa/verify', [AuthController::class, 'verify2FA']);
        });

        // Future admin-only routes requiring 2FA already enabled go here
        // Route::middleware(['role:admin', '2fa'])->group(function () { ... });
    });

    // Admin quote CRUD (separate from the auth:sanctum group to avoid nesting issues)
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/quotes/categories', [QuoteAdminController::class, 'indexCategories']);
        Route::post('/quotes/categories', [QuoteAdminController::class, 'storeCategory']);
        Route::patch('/quotes/categories/{id}', [QuoteAdminController::class, 'updateCategory']);

        Route::get('/quotes/product-types', [QuoteAdminController::class, 'indexProductTypes']);
        Route::post('/quotes/product-types', [QuoteAdminController::class, 'storeProductType']);
        Route::patch('/quotes/product-types/{id}', [QuoteAdminController::class, 'updateProductType']);

        Route::get('/quotes/modifier-groups', [QuoteAdminController::class, 'indexModifierGroups']);
        Route::post('/quotes/modifier-groups', [QuoteAdminController::class, 'storeModifierGroup']);
        Route::patch('/quotes/modifier-groups/{id}', [QuoteAdminController::class, 'updateModifierGroup']);

        Route::get('/quotes/modifiers', [QuoteAdminController::class, 'indexModifiers']);
        Route::post('/quotes/modifiers', [QuoteAdminController::class, 'storeModifier']);
        Route::patch('/quotes/modifiers/{id}', [QuoteAdminController::class, 'updateModifier']);

        // Admin contract management
        Route::post('/contracts', [ContractController::class, 'store']);
        Route::post('/contracts/{id}/approve-send', [ContractController::class, 'approveSend']);
        Route::patch('/contracts/{id}/cancel', [ContractController::class, 'cancel']);

        // Admin project management
        Route::patch('/projects/{id}', [ProjectController::class, 'update']);
        Route::post('/projects/{id}/milestones', [ProjectController::class, 'storeMilestone']);
        Route::patch('/projects/{id}/pause-clock', [ProjectController::class, 'pauseClock']);

        // Admin payment confirmation (bank transfers)
        Route::patch('/payments/{id}/confirm', [PaymentController::class, 'confirm']);

        // Admin — Settings
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::patch('/settings', [SettingsController::class, 'update']);

        // Admin — CV upload
        Route::post('/cv', [CVController::class, 'upload']);

        // Admin — Profile links
        Route::patch('/profile-links', [ProfileLinksController::class, 'update']);

        // Admin — Deleted users
        Route::get('/deleted-users', [DeletedUsersController::class, 'index']);

        // Admin — Dashboard
        Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
        Route::get('/dashboard/recalibration', [DashboardController::class, 'recalibration']);

        // Admin — Blog posts
        Route::apiResource('/blog/posts', BlogAdminController::class);
        Route::patch('/blog/comments/{id}/moderate', [BlogAdminController::class, 'moderateComment']);

        // Admin — Portfolio
        Route::apiResource('/portfolio', PortfolioAdminController::class);

        // Admin — Testimonials
        Route::patch('/testimonials/{id}/approve', [TestimonialAdminController::class, 'approve']);
        Route::patch('/testimonials/{id}/reject', [TestimonialAdminController::class, 'reject']);
    });
});
