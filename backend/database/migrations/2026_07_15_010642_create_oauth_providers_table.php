<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the oauth_providers table per DATA_MODEL.md §1.
     * Stores linked OAuth identities (Google, GitHub, Facebook) per user.
     * Composite unique index on (provider, provider_id) prevents duplicate links.
     */
    public function up(): void
    {
        Schema::create('oauth_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider');                               // 'google', 'github', 'facebook'
            $table->string('provider_id');                            // The user's ID on that provider
            $table->string('provider_avatar_url')->nullable();        // Raw URL, copied into media on linking
            $table->timestamps();

            // Composite unique: prevents a provider account from being linked to multiple users
            $table->unique(['provider', 'provider_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oauth_providers');
    }
};
