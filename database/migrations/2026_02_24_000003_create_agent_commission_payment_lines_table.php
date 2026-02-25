<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_commission_payment_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id');
            $table->uuid('commission_id');
            $table->decimal('amount_applied', 12, 2);
            $table->timestamps();

            $table->foreign('payment_id')->references('id')->on('agent_commission_payments')->cascadeOnDelete();
            $table->foreign('commission_id')->references('id')->on('agent_commissions')->cascadeOnDelete();
            $table->index('payment_id');
            $table->index('commission_id');
            $table->unique(['payment_id', 'commission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_commission_payment_lines');
    }
};
