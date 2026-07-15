<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\Verify2FARequest;
use App\Http\Resources\UserResource;
use App\Models\OAuthProvider;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    /**
     * Valid OAuth providers.
     */
    private const VALID_PROVIDERS = ['google', 'github', 'facebook'];

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Assign the default client role
        $user->assignRole('client');

        // Generate initials-based avatar
        $this->generateInitialsAvatar($user);

        // Generate a Sanctum token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => new UserResource($user->load('roles')),
            ],
        ], 201);
    }

    /**
     * Log in an existing user.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! Auth::attempt([
            'email' => $validated['email'],
            'password' => $validated['password'],
        ])) {
            return response()->json([
                'errors' => [
                    'email' => ['Invalid credentials'],
                ],
            ], 422);
        }

        /** @var User $user */
        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => new UserResource($user->load('roles')),
            ],
        ]);
    }

    /**
     * Log out the current user (revoke the current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data' => [
                'message' => 'Logged out',
            ],
        ]);
    }

    /**
     * Get the currently authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()->load('roles')),
        ]);
    }

    // ─── OAuth ────────────────────────────────────────────────────────────────

    /**
     * Redirect the user to the OAuth provider.
     */
    public function redirectToProvider(string $provider): JsonResponse
    {
        $this->validateProvider($provider);

        // Generate and store state parameter for CSRF protection
        $state = Str::random(40);
        session(['oauth_state_'.$provider => $state]);

        $redirectUrl = Socialite::driver($provider)
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'data' => [
                'redirect_url' => $redirectUrl,
            ],
        ]);
    }

    /**
     * Handle the OAuth provider callback.
     */
    public function handleProviderCallback(string $provider): JsonResponse
    {
        $this->validateProvider($provider);

        // Verify OAuth state parameter to prevent CSRF attacks
        $storedState = session()->pull('oauth_state_'.$provider);
        $receivedState = request()->query('state');

        if (! $storedState || ! $receivedState || ! hash_equals($storedState, $receivedState)) {
            return response()->json([
                'errors' => ['provider' => ['Invalid state parameter. Possible CSRF attack.']],
            ], 400);
        }

        try {
            $socialiteUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json([
                'errors' => [
                    'provider' => ['Failed to authenticate with '.$provider.'. Please try again.'],
                ],
            ], 422);
        }

        $providerId = $socialiteUser->getId();
        $email = $socialiteUser->getEmail();
        $name = $socialiteUser->getName() ?? $socialiteUser->getNickname() ?? 'User';
        $avatarUrl = $socialiteUser->getAvatar();

        // Check if this provider account is already linked
        $oauthProvider = OAuthProvider::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($oauthProvider) {
            // Log in as the linked user
            $user = $oauthProvider->user;
        } elseif ($email && User::where('email', $email)->exists()) {
            // Link to existing user by email
            $user = User::where('email', $email)->first();

            OAuthProvider::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_id' => $providerId,
                'provider_avatar_url' => $avatarUrl,
            ]);
        } else {
            // Create a new user
            $user = User::create([
                'name' => $name,
                'email' => $email ?? ('oauth-'.$provider.'-'.$providerId.'@anonymous'),
                'password' => null,
            ]);

            $user->assignRole('client');

            OAuthProvider::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_id' => $providerId,
                'provider_avatar_url' => $avatarUrl,
            ]);
        }

        // Import avatar from provider if available
        if ($avatarUrl) {
            $this->importAvatarFromUrl($user, $avatarUrl);
        }

        // Generate Sanctum token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => new UserResource($user->load('roles')),
            ],
        ]);
    }

    // ─── 2FA ──────────────────────────────────────────────────────────────────

    /**
     * Enable 2FA for the admin user (generates a TOTP secret and QR code URL).
     */
    public function enable2FA(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->two_factor_enabled) {
            return response()->json([
                'errors' => ['2fa' => ['Two-factor authentication is already enabled.']],
            ], 422);
        }

        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey();

        // Store the encrypted secret (pending verification)
        $user->two_factor_secret = $secret;
        $user->two_factor_enabled = false;
        $user->save();

        // Generate the QR code URL for Google Authenticator
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return response()->json([
            'data' => [
                'secret' => $secret,
                'qr_code_url' => $qrCodeUrl,
            ],
        ]);
    }

    /**
     * Verify the 2FA code and enable 2FA for the user.
     */
    public function verify2FA(Verify2FARequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->two_factor_secret)) {
            return response()->json([
                'errors' => [
                    'code' => ['2FA has not been enabled yet. Please request a secret first.'],
                ],
            ], 422);
        }

        $google2fa = new Google2FA;
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->validated()['code']);

        if (! $valid) {
            return response()->json([
                'errors' => [
                    'code' => ['The provided code is invalid.'],
                ],
            ], 422);
        }

        $user->two_factor_enabled = true;
        $user->save();

        return response()->json([
            'data' => [
                'message' => '2FA has been enabled successfully.',
            ],
        ]);
    }

    // ─── Account Management ───────────────────────────────────────────────────

    /**
     * Soft-delete the authenticated user's account.
     */
    public function destroyAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'exit_survey_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! empty($validated['exit_survey_reason'])) {
            $user->exit_survey_reason = $validated['exit_survey_reason'];
            $user->save();
        }

        // Revoke all tokens
        $user->tokens()->delete();

        // Soft delete the user — marks the start of the retention window
        $user->delete();

        return response()->json([
            'data' => [
                'message' => 'Account scheduled for deletion',
            ],
        ]);
    }

    /**
     * Export the authenticated user's data as JSON.
     */
    public function exportAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load([
            'quotes',
            'projects.milestones',
            'projects.contracts',
        ]);

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'quotes' => $user->quotes,
                'projects' => $user->projects,
            ],
        ]);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Validate the OAuth provider.
     */
    private function validateProvider(string $provider): void
    {
        abort_unless(in_array($provider, self::VALID_PROVIDERS, true), 422, "Provider '{$provider}' is not supported.");
    }

    /**
     * Generate an initials-based avatar for a user who registered via email/password.
     */
    private function generateInitialsAvatar(User $user): void
    {
        $name = $user->name;
        $words = explode(' ', $name);
        $initials = '';

        foreach ($words as $word) {
            if (! empty($word)) {
                $initials .= strtoupper($word[0]);
            }
        }

        $initials = substr($initials, 0, 2);

        // Generate a deterministic color from the name
        $hash = crc32($name);
        $hue = $hash % 360;

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="hsl({$hue}, 60%, 50%)" rx="50"/>
  <text x="50" y="50" text-anchor="middle" dy=".35em" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold">{$initials}</text>
</svg>
SVG;

        // Save as temporary file and add to media library
        $tempPath = tempnam(sys_get_temp_dir(), 'avatar_').'.svg';
        file_put_contents($tempPath, $svg);

        $media = $user->addMedia($tempPath)
            ->usingName('avatar')
            ->toMediaCollection('avatar');

        $user->avatar_media_id = $media->id;
        $user->save();

        unlink($tempPath);
    }

    /**
     * Import an avatar from a URL (OAuth provider) into the user's media library.
     */
    private function importAvatarFromUrl(User $user, string $avatarUrl): void
    {
        // Validate URL to prevent SSRF attacks
        $url = filter_var($avatarUrl, FILTER_VALIDATE_URL);

        if (! $url) {
            Log::warning('Invalid avatar URL format for user {id}', ['id' => $user->id]);

            return;
        }

        $host = parse_url($url, PHP_URL_HOST);

        if (! $host) {
            Log::warning('Avatar URL has no host for user {id}', ['id' => $user->id]);

            return;
        }

        // Only allow known OAuth provider avatar hosts
        $allowedHosts = [
            'avatars.githubusercontent.com',
            'lh3.googleusercontent.com',
            'graph.facebook.com',
            'platform-lookaside.fbsbx.com',
        ];

        $hostAllowed = false;

        foreach ($allowedHosts as $allowed) {
            if (str_ends_with($host, $allowed)) {
                $hostAllowed = true;

                break;
            }
        }

        if (! $hostAllowed) {
            Log::warning('Avatar URL host not allowed for user {id}: {host}', [
                'id' => $user->id,
                'host' => $host,
            ]);

            return;
        }

        try {
            $media = $user->addMediaFromUrl($url)
                ->usingName('avatar')
                ->toMediaCollection('avatar');

            $user->avatar_media_id = $media->id;
            $user->save();
        } catch (\Exception $e) {
            // Fall back to initials avatar — a missing avatar shouldn't break the auth flow
            Log::warning('Failed to import avatar for user {id}: {message}', [
                'id' => $user->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
