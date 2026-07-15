<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the testimonials table per DATA_MODEL.md §5.
     * FK nullable to projects, FK nullable to media (avatar).
     */
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->string('company_role')->nullable();
            $table->text('content');
            $table->smallInteger('rating')->nullable(); // 1-5
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('avatar_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('status'); // 'pending' | 'approved' | 'rejected'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
