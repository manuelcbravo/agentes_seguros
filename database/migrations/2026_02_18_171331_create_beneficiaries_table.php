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
        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('policy_id');

            $table->string('name');
            $table->date('birthday')->nullable();
            $table->string('rfc')->nullable();
            $table->text('address')->nullable();
            $table->string('occupation')->nullable();
            $table->string('company_name')->nullable();
            $table->decimal('approx_income', 14, 2)->nullable();
            $table->text('medical_history')->nullable();
            $table->string('insurer_company')->nullable();
            $table->string('main_savings_goal')->nullable();
            $table->text('personal_interests')->nullable();
            $table->text('personal_likes')->nullable();
            $table->boolean('smokes')->default(false);
            $table->boolean('drinks')->default(false);
            $table->string('personality')->nullable();
            $table->integer('relationship')->nullable();
            $table->decimal('benefit_percentage', 5, 2)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('policy_id')->references('id')->on('policies')->cascadeOnDelete();
            $table->index('policy_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};
