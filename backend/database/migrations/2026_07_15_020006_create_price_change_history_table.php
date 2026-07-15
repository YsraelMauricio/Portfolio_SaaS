<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the price_change_history table per DATA_MODEL.md §2.
     * Uses Eloquent polymorphic relation (morphTo) for changeable_type/changeable_id.
     * FK to users for admin_id.
     */
    public function up(): void
    {
        Schema::create('price_change_history', function (Blueprint $table) {
            $table->id();
            $table->morphs('changeable'); // changeable_type (string), changeable_id (bigint)
            $table->decimal('old_value', 10, 2);
            $table->decimal('new_value', 10, 2);
            $table->text('reason')->nullable();
            $table->foreignId('admin_id')->constrained('users');
            $table->timestamps();

            // Index on polymorphic columns is already created by morphs() above
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_change_history');
    }
};
