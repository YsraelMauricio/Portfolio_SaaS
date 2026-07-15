<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the chatbot_conversations table per DATA_MODEL.md §7.
     * FK to users is nullable (anonymous visitors).
     */
    public function up(): void
    {
        Schema::create('chatbot_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_id');
            $table->string('status'); // 'active' | 'escalated' | 'closed'
            $table->string('escalation_channel')->nullable(); // 'whatsapp' | 'telegram' | 'email'
            $table->text('escalation_summary')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_conversations');
    }
};
