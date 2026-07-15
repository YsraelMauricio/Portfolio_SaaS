<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the payments table per DATA_MODEL.md §3.
     * FK to projects (required), FK to contracts (nullable), FK to media (nullable).
     * provider_transaction_id is unique when not null (idempotency basis).
     * is_test index for BI dashboard filtering.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained();
            $table->foreignId('contract_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount_usd', 10, 2);
            $table->string('method'); // 'qr_bcb' | 'binance_pay' | 'paypal' | 'bank_transfer'
            $table->string('local_currency', 3)->nullable();
            $table->decimal('amount_local', 10, 2)->nullable();
            $table->decimal('exchange_rate_used', 10, 4)->nullable();
            $table->foreignId('exchange_rate_overridden_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider_transaction_id')->nullable()->unique();
            $table->boolean('webhook_signature_verified')->default(false);
            $table->string('status'); // 'pending' | 'confirmed' | 'rejected'
            $table->foreignId('proof_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('confirmed_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->boolean('is_test')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
