<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the quotes table per DATA_MODEL.md §2.
     * FK to users is nullable (anonymous visitor quotes).
     * FK to product_types is required.
     */
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_type_id')->constrained();
            $table->decimal('estimated_price_min', 10, 2);
            $table->decimal('estimated_price_max', 10, 2);
            $table->integer('estimated_days_min');
            $table->integer('estimated_days_max');
            $table->string('currency', 3)->default('USD');
            $table->string('status'); // 'saved' | 'sent_as_lead'
            $table->boolean('is_test')->default(false)->index();
            $table->string('locale', 5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
