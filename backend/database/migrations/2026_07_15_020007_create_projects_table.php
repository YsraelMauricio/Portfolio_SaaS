<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the projects table per DATA_MODEL.md §3.
     * FK to quotes is nullable (custom project escape hatch).
     * FK to users is the client.
     * Index on status for pipeline queries and "next available start date" lookups.
     * Index on is_test for BI dashboard filtering.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->string('status'); // 'submitted' | 'under_review' | 'approved' | 'in_development' | 'delivered' | 'cancelled'
            $table->date('actual_start_date')->nullable();
            $table->date('confirmed_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->integer('paused_days')->default(0);
            $table->boolean('scope_changed')->default(false);
            $table->boolean('is_test')->default(false)->index();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
