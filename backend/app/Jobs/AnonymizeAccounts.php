<?php

namespace App\Jobs;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AnonymizeAccounts implements ShouldQueue
{
    use Dispatchable, Queueable;

    /**
     * Execute the job.
     *
     * Finds users whose retention window has expired and anonymizes their personal data.
     * The retention window is read from the `settings` table (key: `account_retention_days`).
     * Defaults to 60 days if the setting is not present.
     */
    public function handle(): void
    {
        $retentionDays = (int) Setting::get('account_retention_days', '60');

        $expired = User::whereNotNull('deleted_at')
            ->whereNull('anonymized_at')
            ->where('deleted_at', '<', now()->subDays($retentionDays))
            ->cursor();

        foreach ($expired as $user) {
            /** @var User $user */
            $user->timestamps = false;

            $user->name = "Deleted User #{$user->id}";
            $user->email = "deleted-{$user->id}@anonymous";
            $user->password = Hash::make(Str::random(60));
            $user->anonymized_at = now();
            $user->remember_token = null;
            $user->two_factor_secret = null;
            $user->two_factor_enabled = false;
            $user->exit_survey_reason = null;

            $user->save();
        }
    }
}
