<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('public');
    }

    // ─── Registration ────────────────────────────────────────────────────────

    public function test_registration_returns_201_with_token_and_user(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'preferred_locale',
                    'two_factor_enabled',
                    'created_at',
                    'updated_at',
                    'roles',
                ],
            ],
        ]);

        $this->assertEquals('test@example.com', $response->json('data.user.email'));
        $this->assertEquals('Test User', $response->json('data.user.name'));
        $this->assertContains('client', $response->json('data.user.roles'));
    }

    public function test_registration_duplicate_email_returns_422(): void
    {
        // Create a user with this email first
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        // Try to register with the same email
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_name_email_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'No Confirm',
            'email' => 'noconfirm@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    public function test_login_valid_credentials_returns_200_with_token(): void
    {
        $password = 'correct-password';
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make($password),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => $password,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
            ],
        ]);
    }

    public function test_login_invalid_credentials_returns_422(): void
    {
        User::factory()->create([
            'email' => 'real@example.com',
            'password' => Hash::make('real-password'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'real@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => [
                'email' => ['Invalid credentials'],
            ],
        ]);
    }

    public function test_login_rate_limited_after_5_attempts(): void
    {
        $email = 'ratelimit@example.com';
        $password = 'real-password';

        User::factory()->create([
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        // Make 6 login attempts with invalid credentials to trigger rate limiting
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'wrong-password-' . $i,
            ]);
        }

        // The 6th attempt should be rate-limited (429)
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'wrong-password-5',
        ]);

        $response->assertStatus(429);
    }

    // ─── Authenticated routes ─────────────────────────────────────────────────

    public function test_logout_revokes_token(): void
    {
        // Register a user and get a token
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Logout User',
            'email' => 'logout@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $response->json('data.token');

        // Logout
        $logoutResponse = $this->withToken($token)
            ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertStatus(200);
        $logoutResponse->assertJson([
            'data' => ['message' => 'Logged out'],
        ]);

        // Assert the token is now invalid.
        // Log out all guards to clear the cached session-based auth,
        // forcing Sanctum to re-validate the bearer token against the database.
        auth()->guard('web')->logout();
        auth()->forgetGuards();
        $this->withToken($token)
            ->getJson('/api/v1/auth/user')
            ->assertStatus(401);
    }

    public function test_user_returns_authenticated_user(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Me User',
            'email' => 'me@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $response->json('data.token');

        $userResponse = $this->withToken($token)
            ->getJson('/api/v1/auth/user');

        $userResponse->assertStatus(200);
        $userResponse->assertJson([
            'data' => [
                'email' => 'me@example.com',
                'name' => 'Me User',
            ],
        ]);
    }

    public function test_user_unauthenticated_returns_401(): void
    {
        $this->getJson('/api/v1/auth/user')
            ->assertStatus(401);
    }
}
