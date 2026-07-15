<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the maintenance_subscriptions table per DATA_MODEL.md §4.
     * FK to users and FK to maintenance_plans.
     */
    public function up(): void
    {
        Schema::create('maintenance_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('plan_id')->constrained('maintenance_plans');
            $table->string('status'); // 'active' | 'paused' | 'cancelled'
            $table->string('billing_cycle'); // 'monthly' | 'annual'
            $table->date('start_date');
            $table->date('next_billing_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_subscriptions');
    }
};
