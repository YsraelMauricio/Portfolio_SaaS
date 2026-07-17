<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * To run the staging seeder (is_test = true data for staging validation):
     *   php artisan db:seed --class=StagingSeeder
     *
     * StagingSeeder is NOT called here by default — it is only invoked explicitly.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            QuoteEngineSeeder::class,
        ]);
    }
}
