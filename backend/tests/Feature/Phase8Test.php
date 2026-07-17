<?php

namespace Tests\Feature;

use App\Jobs\DatabaseBackupJob;
use App\Jobs\QuarterlyRecalibrationReminderJob;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Quote;
use App\Notifications\QuarterlyRecalibrationReminder;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\StagingSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class Phase8Test extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  DatabaseBackupJob
    // ────────────────────────────────────────────────────────────────────────────

    public function test_backup_job_gracefully_skips_when_using_sqlite(): void
    {
        $this->assertEquals('sqlite', config('database.default'));

        // Should not throw any exception — the driver check logs and returns early.
        (new DatabaseBackupJob())->handle();

        $this->assertTrue(true, 'Job completed without exception on SQLite driver');
    }

    public function test_backup_job_logs_error_when_pg_dump_not_available(): void
    {
        // Override only the driver config for the current default connection so the
        // job proceeds past the driver check. We do NOT change database.default
        // itself — that would break the test framework's SQLite transaction.
        $originalDriver = config('database.connections.sqlite.driver');

        try {
            config(['database.connections.sqlite.driver' => 'pgsql']);

            // pg_dump is not available in the test environment.
            // The job logs the error and then re-throws the exception.
            $exceptionThrown = false;
            try {
                (new DatabaseBackupJob())->handle();
            } catch (\Throwable $e) {
                $exceptionThrown = true;
            }

            $this->assertTrue(
                $exceptionThrown,
                'Expected an exception because pg_dump is not available'
            );
        } finally {
            config(['database.connections.sqlite.driver' => $originalDriver]);
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  QuarterlyRecalibrationReminderJob
    // ────────────────────────────────────────────────────────────────────────────

    public function test_recalibration_job_skips_when_no_delivered_projects(): void
    {
        Notification::fake();

        (new QuarterlyRecalibrationReminderJob())->handle();

        Notification::assertNothingSent();
    }

    public function test_recalibration_job_sends_reminder_when_projects_exist(): void
    {
        // Create a delivered project matching all criteria:
        // is_test = false, status = delivered, scope_changed = false,
        // actual_delivery_date and confirmed_delivery_date both set.
        Project::factory()->create([
            'status' => 'delivered',
            'scope_changed' => false,
            'is_test' => false,
            'actual_delivery_date' => now()->subDays(5),
            'confirmed_delivery_date' => now()->subDays(7),
        ]);

        Notification::fake();

        (new QuarterlyRecalibrationReminderJob())->handle();

        // Assert a QuarterlyRecalibrationReminder was sent to the admin.
        Notification::assertSentTimes(QuarterlyRecalibrationReminder::class, 1);
    }

    public function test_recalibration_job_excludes_scope_changed_projects(): void
    {
        // Create a delivered project with scope_changed = true (should be excluded).
        Project::factory()->create([
            'status' => 'delivered',
            'scope_changed' => true,
            'is_test' => false,
            'actual_delivery_date' => now()->subDays(5),
            'confirmed_delivery_date' => now()->subDays(7),
        ]);

        Notification::fake();

        (new QuarterlyRecalibrationReminderJob())->handle();

        Notification::assertNothingSent();
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  StagingSeeder
    // ────────────────────────────────────────────────────────────────────────────

    public function test_staging_seeder_creates_test_data(): void
    {
        // StagingSeeder requires the quote-engine product types to be seeded first.
        $this->seed(QuoteEngineSeeder::class);

        (new StagingSeeder())->run();

        // Assert the test admin user was created
        $this->assertDatabaseHas('users', [
            'email' => 'test-admin@ysraelmauricio.com',
        ]);

        // Assert at least one record exists per entity with is_test = true
        $this->assertGreaterThan(
            0,
            Quote::where('is_test', true)->count(),
            'Expected at least one test quote'
        );

        $this->assertGreaterThan(
            0,
            Project::where('is_test', true)->count(),
            'Expected at least one test project'
        );

        $this->assertGreaterThan(
            0,
            Contract::where('is_test', true)->count(),
            'Expected at least one test contract'
        );

        $this->assertGreaterThan(
            0,
            Payment::where('is_test', true)->count(),
            'Expected at least one test payment'
        );
    }

    public function test_all_seeded_records_have_is_test_true(): void
    {
        $this->seed(QuoteEngineSeeder::class);

        (new StagingSeeder())->run();

        // Verify every single seeded record has is_test = true
        $quotes = Quote::all();
        $this->assertNotEmpty($quotes, 'Expected at least one seeded quote');
        foreach ($quotes as $quote) {
            $this->assertTrue(
                $quote->is_test,
                "Quote #{$quote->id} does not have is_test = true"
            );
        }

        $projects = Project::all();
        $this->assertNotEmpty($projects, 'Expected at least one seeded project');
        foreach ($projects as $project) {
            $this->assertTrue(
                $project->is_test,
                "Project #{$project->id} does not have is_test = true"
            );
        }

        $contracts = Contract::all();
        $this->assertNotEmpty($contracts, 'Expected at least one seeded contract');
        foreach ($contracts as $contract) {
            $this->assertTrue(
                $contract->is_test,
                "Contract #{$contract->id} does not have is_test = true"
            );
        }

        $payments = Payment::all();
        $this->assertNotEmpty($payments, 'Expected at least one seeded payment');
        foreach ($payments as $payment) {
            $this->assertTrue(
                $payment->is_test,
                "Payment #{$payment->id} does not have is_test = true"
            );
        }
    }
}
