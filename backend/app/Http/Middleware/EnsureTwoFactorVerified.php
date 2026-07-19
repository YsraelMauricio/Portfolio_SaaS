<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTwoFactorVerified
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->two_factor_enabled && ! session('2fa_verified')) {
            return response()->json([
                'errors' => ['2fa' => ['Two-factor verification required.']],
            ], 403);
        }

        return $next($request);
    }
}
