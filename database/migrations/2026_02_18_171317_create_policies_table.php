<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('client_id')->nullable();
            $table->uuid('insured_id');

            $table->string('status')->index();
            $table->string('payment_channel')->nullable();
            $table->string('product')->nullable();
            $table->date('coverage_start')->nullable();
            $table->decimal('risk_premium', 14, 2)->nullable();
            $table->decimal('fractional_premium', 14, 2)->nullable();
            $table->string('periodicity')->nullable();
            $table->smallInteger('month')->nullable();
            $table->integer('currency')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
            $table->foreign('insured_id')->references('id')->on('insureds')->cascadeOnDelete();

            $table->index('client_id');
            $table->index('insured_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policies');
    }
};
