<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class DatabaseBackupJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, Queueable;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 300;

    /**
     * The number of seconds the unique lock is kept — prevents overlapping runs.
     */
    public int $uniqueFor = 3600;

    /**
     * Execute the job.
     *
     * Creates a PostgreSQL dump via pg_dump, compresses it with gzip,
     * stores it in storage/app/backups/, and prunes backups beyond the last 7.
     */
    public function handle(): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        // Only PostgreSQL is supported for the native dump approach.
        if (($dbConfig['driver'] ?? '') !== 'pgsql') {
            Log::info('DatabaseBackupJob: Skipped — not using PostgreSQL driver');

            return;
        }

        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = $dbConfig['port'] ?? '5432';
        $database = $dbConfig['database'] ?? 'portfolio_saas';
        $username = $dbConfig['username'] ?? 'portfolio_saas';
        $password = $dbConfig['password'] ?? '';

        $backupDir = storage_path('app/backups');

        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $filename = 'backup_'.now()->format('Y-m-d_His').'.sql.gz';
        $filepath = "{$backupDir}/{$filename}";

        // Build the pg_dump command.
        $command = [
            'pg_dump',
            '--host='.$host,
            '--port='.$port,
            '--username='.$username,
            '--dbname='.$database,
            '--no-owner',
            '--no-acl',
        ];

        $process = new Process($command);
        $process->setTimeout(240);
        $process->setEnv(['PGPASSWORD' => $password]);

        try {
            $process->mustRun();

            // Compress the dump output with gzip.
            $gzipped = gzencode($process->getOutput(), 9);
            file_put_contents($filepath, $gzipped);

            Log::info('DatabaseBackupJob: Backup created successfully', [
                'file' => $filename,
                'size' => strlen($gzipped),
            ]);

            // Retain only the most recent 7 backup files.
            $this->cleanOldBackups($backupDir);
        } catch (\Throwable $e) {
            Log::error('DatabaseBackupJob: Backup failed', [
                'error' => $e->getMessage(),
            ]);

            // Check if pg_dump binary is the problem — log a graceful hint.
            if (str_contains($e->getMessage(), 'pg_dump: command not found')
                || str_contains($e->getMessage(), 'The process "pg_dump" not found')
                || str_contains($e->getMessage(), 'ENOENT')) {
                Log::warning('DatabaseBackupJob: pg_dump is not available on this system — backup skipped gracefully');
            }

            throw $e;
        }
    }

    /**
     * Remove backup files exceeding the retention limit of 7.
     */
    private function cleanOldBackups(string $backupDir): void
    {
        $files = glob("{$backupDir}/backup_*.sql.gz");

        if ($files === false || count($files) <= 7) {
            return;
        }

        // Sort by modification time (oldest first) so we delete the oldest first.
        usort($files, fn (string $a, string $b): int => filemtime($a) - filemtime($b));

        $toDelete = array_slice($files, 0, count($files) - 7);

        foreach ($toDelete as $file) {
            unlink($file);
            Log::info('DatabaseBackupJob: Removed old backup', [
                'file' => basename($file),
            ]);
        }
    }
}
