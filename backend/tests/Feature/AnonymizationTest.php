<?php

namespace Tests\Feature;

use App\Jobs\AnonymizeAccounts;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AnonymizationTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_anonymizes_user_past_retention_window(): void
    {
        // Create a user who was soft-deleted 61 days ago (past the default 60-day retention)
        $originalPassword = Hash::make('original-password');

        $user = User::factory()->create([
            'name' => 'Alice Smith',
            'email' => 'alice@example.com',
            'password' => $originalPassword,
            'two_factor_secret' => 'some-secret-key',
            'two_factor_enabled' => true,
        ]);

        // Set non-fillable attributes after creation (deleted_at, remember_token, exit_survey_reason)
        $user->forceFill([
            'deleted_at' => now()->subDays(61),
            'remember_token' => 'some-remember-token',
            'exit_survey_reason' => 'Not needed anymore',
        ])->save();

        $userId = $user->id;

        // Verify the user is actually soft-deleted and past retention before running the job
        $fresh = $user->fresh();
        $this->assertNotNull($fresh->deleted_at, 'User must be soft-deleted.');
        $this->assertNull($fresh->anonymized_at, 'User must not be anonymized yet.');
        $this->assertTrue(
            $fresh->deleted_at->lt(now()->subDays(60)),
            'deleted_at must be more than 60 days ago.'
        );

        // Run the anonymization job
        AnonymizeAccounts::dispatchSync();

        // Fetch the user from the database (still exists — soft-deleted but not hard-deleted)
        $anonymized = User::withTrashed()->find($userId);

        $this->assertNotNull($anonymized, 'User must still exist in the database after anonymization.');

        // Assert name is changed to "Deleted User #X"
        $this->assertEquals("Deleted User #{$userId}", $anonymized->name);

        // Assert email is anonymized
        $this->assertEquals("deleted-{$userId}@anonymous", $anonymized->email);

        // Assert password has been changed to a new random hash (different from original)
        $this->assertNotEquals($originalPassword, $anonymized->password);
        $this->assertTrue(Hash::check('original-password', $originalPassword), 'Original hash should match the original password.');
        $this->assertFalse(Hash::check('original-password', $anonymized->password), 'New hash should NOT match the original password.');

        // Assert anonymized_at is set
        $this->assertNotNull($anonymized->anonymized_at);
        $this->assertTrue($anonymized->anonymized_at->isToday(), 'anonymized_at should be set to today.');

        // Assert 2FA data is cleared
        $this->assertNull($anonymized->two_factor_secret);
        $this->assertFalse($anonymized->two_factor_enabled);

        // Assert remember_token is null
        $this->assertNull($anonymized->remember_token);

        // Assert exit_survey_reason is cleared
        $this->assertNull($anonymized->exit_survey_reason);

        // Assert the user is still soft-deleted
        $this->assertNotNull($anonymized->deleted_at);
    }

    public function test_does_not_anonymize_users_within_retention_window(): void
    {
        // Create a user who was soft-deleted 30 days ago (within the default 60-day retention)
        $user = User::factory()->create([
            'name' => 'Bob Jones',
            'email' => 'bob@example.com',
        ]);

        $user->forceFill([
            'deleted_at' => now()->subDays(30),
        ])->save();

        $userId = $user->id;

        // Run the anonymization job
        AnonymizeAccounts::dispatchSync();

        // Assert the user is NOT anonymized
        $fresh = User::withTrashed()->find($userId);
        $this->assertEquals('Bob Jones', $fresh->name);
        $this->assertEquals('bob@example.com', $fresh->email);
        $this->assertNull($fresh->anonymized_at);
    }

    public function test_does_not_anonymize_users_without_deleted_at(): void
    {
        // Create an active user (not deleted)
        $user = User::factory()->create([
            'name' => 'Charlie Active',
            'email' => 'charlie@example.com',
        ]);

        $userId = $user->id;

        // Run the anonymization job
        AnonymizeAccounts::dispatchSync();

        // Assert the active user is untouched
        $fresh = User::withTrashed()->find($userId);
        $this->assertEquals('Charlie Active', $fresh->name);
        $this->assertNull($fresh->anonymized_at);
    }

    public function test_does_not_anonymize_already_anonymized_users(): void
    {
        // Create a user already anonymized
        $user = User::factory()->create([
            'name' => 'Deleted User #42',
            'email' => 'deleted-42@anonymous',
        ]);

        $user->forceFill([
            'deleted_at' => now()->subDays(100),
            'anonymized_at' => now()->subDays(10),
        ])->save();

        $userId = $user->id;

        // Run the job again
        AnonymizeAccounts::dispatchSync();

        // Re-assert — should be unchanged
        $fresh = User::withTrashed()->find($userId);
        $this->assertEquals('Deleted User #42', $fresh->name);
        $this->assertEquals('deleted-42@anonymous', $fresh->email);
        $this->assertNotNull($fresh->anonymized_at);
    }

    public function test_uses_custom_retention_from_settings(): void
    {
        // Set a custom short retention via the settings table
        Setting::create(['key' => 'account_retention_days', 'value' => '5']);

        // Create a user deleted 6 days ago (past the custom 5-day window)
        $user = User::factory()->create([
            'name' => 'Diana Custom',
            'email' => 'diana@example.com',
        ]);

        $user->forceFill([
            'deleted_at' => now()->subDays(6),
        ])->save();

        $userId = $user->id;

        $fresh = $user->fresh();
        $this->assertNotNull($fresh->deleted_at, 'User must be soft-deleted for custom retention test.');
        $this->assertTrue(
            $fresh->deleted_at->lt(now()->subDays(5)),
            'deleted_at must be more than 5 days ago.'
        );

        // Run the job
        AnonymizeAccounts::dispatchSync();

        // Assert user IS anonymized (past the custom 5-day window)
        $fresh = User::withTrashed()->find($userId);
        $this->assertEquals("Deleted User #{$userId}", $fresh->name);
        $this->assertEquals("deleted-{$userId}@anonymous", $fresh->email);
        $this->assertNotNull($fresh->anonymized_at);
    }
}
