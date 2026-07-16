<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds soft-delete columns to blog_posts and portfolio_projects
     * to support the SoftDeletes trait on their models.
     */
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('portfolio_projects', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('portfolio_projects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
