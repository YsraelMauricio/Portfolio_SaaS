<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the portfolio_project_translations table per DATA_MODEL.md §5.
     * Composite unique constraint on (portfolio_project_id, locale) — non-negotiable per §9.
     */
    public function up(): void
    {
        Schema::create('portfolio_project_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_project_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description');
            $table->string('key_result')->nullable();
            $table->timestamps();

            // Composite unique — non-negotiable per DATA_MODEL.md §9
            $table->unique(['portfolio_project_id', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_project_translations');
    }
};
