<?php

namespace Tests\Feature;

use App\Jobs\AnonymizeAccounts;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    public function test_account_soft_deletes_user_and_revokes_tokens(): void
    {
        // Register a user via the API
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $token = $response->json('data.token');
        $userId = $response->json('data.user.id');

        // Ensure the user exists before deletion
        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'deleted_at' => null,
        ]);

        // Delete the account
        $deleteResponse = $this->withToken($token)
            ->deleteJson('/api/v1/account');

        $deleteResponse->assertStatus(200);
        $deleteResponse->assertJson([
            'data' => ['message' => 'Account scheduled for deletion'],
        ]);

        // Assert the user is in the database (soft-deleted, not hard-deleted)
        $user = User::withTrashed()->find($userId);
        $this->assertNotNull($user, 'User should still exist in the database after soft delete.');
        $this->assertNotNull($user->deleted_at, 'User should have a deleted_at timestamp.');
        $this->assertNull($user->anonymized_at, 'User should not be anonymized yet.');

        // Assert the user is not returned by normal queries
        $this->assertNull(User::find($userId), 'User should not be findable without withTrashed().');

        // Assert the token is revoked (cannot access authenticated routes).
        // Sanctum's Guard checks the web guard (session) first, which caches the user
        // within the same test process. We explicitly log out all guards and create
        // a completely isolated request to verify the token is truly invalid.
        auth()->guard('web')->logout();
        auth()->forgetGuards();

        // Use a fresh session-less check: manually verify the token no longer exists
        // in the database, then make an isolated request.
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $userId,
            'tokenable_type' => User::class,
        ]);

        $this->withToken($token)
            ->getJson('/api/v1/auth/user')
            ->assertStatus(401);
    }

    public function test_account_deletion_accepts_optional_exit_survey_reason(): void
    {
        // Register and get token
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $response->json('data.token');
        $userId = $response->json('data.user.id');

        // Delete with exit survey reason
        $this->withToken($token)
            ->deleteJson('/api/v1/account', [
                'exit_survey_reason' => 'Found a better service elsewhere',
            ])
            ->assertStatus(200);

        // Assert exit_survey_reason was saved before soft-delete
        $user = User::withTrashed()->find($userId);
        $this->assertEquals('Found a better service elsewhere', $user->exit_survey_reason);
    }

    public function test_anonymization_job_does_not_affect_users_within_retention_window(): void
    {
        // Set retention window to 1 day (very short for testing)
        Setting::create(['key' => 'account_retention_days', 'value' => '1']);

        // Register and get token
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Retention User',
            'email' => 'retention@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $response->json('data.token');
        $userId = $response->json('data.user.id');

        // Delete the account
        $this->withToken($token)->deleteJson('/api/v1/account');

        // Run the anonymization job
        AnonymizeAccounts::dispatchSync();

        // Assert the user is NOT anonymized (still within the retention window)
        $user = User::withTrashed()->find($userId);
        $this->assertNotNull($user);
        $this->assertNotNull($user->deleted_at);
        $this->assertNull($user->anonymized_at, 'User should not be anonymized when within retention window.');
        $this->assertEquals('Retention User', $user->name, 'User name should remain unchanged within retention window.');
        $this->assertEquals('retention@example.com', $user->email, 'User email should remain unchanged within retention window.');
    }

    public function test_unauthenticated_user_cannot_delete_account(): void
    {
        $this->deleteJson('/api/v1/account')
            ->assertStatus(401);
    }
}
