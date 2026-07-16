<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the cvs table as a media subject for the site-wide CV file.
     * The CV is a singleton — only one row ever exists, used to associate
     * media via Spatie Media Library's polymorphic relationship.
     */
    public function up(): void
    {
        Schema::create('cvs', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        // Seed the singleton row (id=1) so getCvModel() always works
        DB::table('cvs')->insert(['id' => 1]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cvs');
    }
};
