<?php

use App\Http\Middleware\EnsureTwoFactorEnabled;
use App\Http\Middleware\EnsureTwoFactorVerified;
use App\Jobs\AnonymizeAccounts;
use App\Jobs\CloseStaleConversations;
use App\Jobs\DatabaseBackupJob;
use App\Jobs\QuarterlyRecalibrationReminderJob;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            HandleCors::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            '2fa' => EnsureTwoFactorEnabled::class,
            '2fa.verified' => EnsureTwoFactorVerified::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->job(new AnonymizeAccounts)->daily();
        $schedule->job(new CloseStaleConversations)->daily();
        $schedule->job(new DatabaseBackupJob)->dailyAt('00:00');
        $schedule->job(new QuarterlyRecalibrationReminderJob)->cron('0 8 1 1,4,7,10 *');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
