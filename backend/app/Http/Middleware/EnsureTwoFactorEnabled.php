<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class EnsureTwoFactorEnabled
{
    /**
     * Handle an incoming request.
     *
     * Ensures that admin users have 2FA configured before accessing admin routes.
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && $user->hasRole('admin') && ! $user->two_factor_enabled) {
            return response()->json([
                'errors' => ['2fa' => ['Two-factor authentication must be enabled for admin access.']],
            ], 403);
        }

        return $next($request);
    }
}
