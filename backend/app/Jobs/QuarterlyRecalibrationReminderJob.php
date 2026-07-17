<?php

namespace App\Jobs;

use App\Models\Project;
use App\Notifications\QuarterlyRecalibrationReminder;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class QuarterlyRecalibrationReminderJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, Queueable;

    /**
     * The number of seconds the unique lock is kept — prevents overlapping runs.
     */
    public int $uniqueFor = 3600;

    /**
     * Execute the job.
     *
     * Checks for delivered projects with is_test = false and scope_changed = false,
     * then sends a recalibration reminder email to the admin if any are available.
     */
    public function handle(): void
    {
        $totalDeliveredProjects = Project::where('is_test', false)
            ->where('status', 'delivered')
            ->where('scope_changed', false)
            ->count();

        $projectsAvailable = Project::where('is_test', false)
            ->where('status', 'delivered')
            ->where('scope_changed', false)
            ->whereNotNull('actual_delivery_date')
            ->whereNotNull('confirmed_delivery_date')
            ->count();

        if ($projectsAvailable === 0) {
            Log::info('QuarterlyRecalibrationReminderJob: No delivered projects available for recalibration analysis — skipping reminder.', [
                'total_delivered' => $totalDeliveredProjects,
            ]);

            return;
        }

        $adminEmail = config('app.admin_email', 'admin@example.com');

        Notification::route('mail', $adminEmail)
            ->notify(new QuarterlyRecalibrationReminder(
                availableProjects: $projectsAvailable,
                totalDeliveredProjects: $totalDeliveredProjects,
            ));

        Log::info('QuarterlyRecalibrationReminderJob: Recalibration reminder sent successfully.', [
            'admin_email' => $adminEmail,
            'projects_available' => $projectsAvailable,
            'total_delivered' => $totalDeliveredProjects,
        ]);
    }
}
