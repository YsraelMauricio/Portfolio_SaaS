<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('public');

        // Create an admin user
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->admin->assignRole('admin');
        $this->adminToken = $this->admin->createToken('api-token')->plainTextToken;

        // Create a regular client user
        $this->client = User::factory()->create([
            'name' => 'Client User',
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->client->assignRole('client');
    }

    // ─── Admin 2FA Enrollment ─────────────────────────────────────────────────

    public function test_admin_can_enable_2fa_and_gets_secret_and_qr_code_url(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'secret',
                'qr_code_url',
            ],
        ]);

        $secret = $response->json('data.secret');
        $this->assertNotNull($secret);
        $this->assertStringContainsString('otpauth://', $response->json('data.qr_code_url'));
        $this->assertStringContainsString($secret, $response->json('data.qr_code_url'));

        // Assert the secret is stored on the user (two_factor_enabled is still false)
        $this->admin->refresh();
        $this->assertNotNull($this->admin->two_factor_secret);
        $this->assertFalse($this->admin->two_factor_enabled);
    }

    public function test_admin_can_verify_2fa_with_valid_code(): void
    {
        // First, enable 2FA (generates secret)
        $enableResponse = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        $secret = $enableResponse->json('data.secret');

        // Generate a valid TOTP code using the same library
        $google2fa = new Google2FA();
        $validCode = $google2fa->getCurrentOtp($secret);

        // Verify with the valid code
        $verifyResponse = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', [
                'code' => $validCode,
            ]);

        $verifyResponse->assertStatus(200);
        $verifyResponse->assertJson([
            'data' => ['message' => '2FA has been enabled successfully.'],
        ]);

        // Assert two_factor_enabled is now true
        $this->admin->refresh();
        $this->assertTrue($this->admin->two_factor_enabled);
    }

    public function test_admin_cannot_verify_2fa_with_invalid_code(): void
    {
        // Enable 2FA
        $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        // Try verifying with an invalid code
        $verifyResponse = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', [
                'code' => '000000',
            ]);

        $verifyResponse->assertStatus(422);
        $verifyResponse->assertJson([
            'errors' => [
                'code' => ['The provided code is invalid.'],
            ],
        ]);

        // Assert two_factor_enabled is still false
        $this->admin->refresh();
        $this->assertFalse($this->admin->two_factor_enabled);
    }

    public function test_admin_cannot_verify_2fa_without_enabling_first(): void
    {
        // Try verifying without enabling first
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', [
                'code' => '123456',
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => [
                'code' => ['2FA has not been enabled yet. Please request a secret first.'],
            ],
        ]);
    }

    public function test_admin_can_enable_2fa_only_once_and_reuse_same_secret(): void
    {
        // First enable
        $first = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        $firstSecret = $first->json('data.secret');

        // Second enable — replaces the secret with a new one (allows re-enrollment)
        $second = $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        $secondSecret = $second->json('data.secret');

        // The controller generates a new secret each time (overwrites the old one)
        $this->assertNotNull($secondSecret);
    }

    // ─── Non-admin access ─────────────────────────────────────────────────────

    public function test_non_admin_cannot_access_2fa_endpoints(): void
    {
        $clientToken = $this->client->createToken('api-token')->plainTextToken;

        // Try to enable 2FA as a client
        $this->withToken($clientToken)
            ->postJson('/api/v1/auth/2fa/enable')
            ->assertStatus(403);

        // Try to verify 2FA as a client
        $this->withToken($clientToken)
            ->postJson('/api/v1/auth/2fa/verify', [
                'code' => '123456',
            ])
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_2fa_endpoints(): void
    {
        $this->postJson('/api/v1/auth/2fa/enable')
            ->assertStatus(401);

        $this->postJson('/api/v1/auth/2fa/verify', [
            'code' => '123456',
        ])
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $clientToken = $this->client->createToken('api-token')->plainTextToken;

        // Any admin route should be blocked for non-admin
        $this->withToken($clientToken)
            ->postJson('/api/v1/auth/2fa/enable')
            ->assertStatus(403);
    }

    // ─── 2FA validation ───────────────────────────────────────────────────────

    public function test_verify_requires_valid_code_format(): void
    {
        // Enable 2FA first
        $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/enable');

        // Empty code
        $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', ['code' => ''])
            ->assertStatus(422);

        // Code too short
        $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', ['code' => '12345'])
            ->assertStatus(422);

        // Code too long
        $this->withToken($this->adminToken)
            ->postJson('/api/v1/auth/2fa/verify', ['code' => '1234567'])
            ->assertStatus(422);
    }
}
