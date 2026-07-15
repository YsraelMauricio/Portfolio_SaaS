<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the contracts table per DATA_MODEL.md §3.
     * FK to projects (required), FK to media (nullable, for the PDF).
     * is_test index for BI dashboard filtering.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained();
            $table->jsonb('quote_snapshot');
            $table->string('status'); // 'draft' | 'approved_pending_send' | 'sent' | 'signed' | 'cancelled'
            $table->string('documenso_document_id')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('approved_by_admin_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('pdf_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('is_test')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
