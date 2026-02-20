<?php

// database/migrations/2026_02_17_000001_create_or_alter_insureds_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insureds', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('client_id')->nullable();

            $table->date('birthday');
            $table->integer('age_current')->nullable();
            $table->string('phone')->nullable();
            $table->string('rfc')->nullable();
            $table->string('email')->nullable();
            $table->integer('marital_status')->nullable();
            $table->integer('sex')->nullable();
            $table->text('address')->nullable();
            $table->string('occupation')->nullable();
            $table->string('company_name')->nullable();
            $table->decimal('approx_income', 14, 2)->nullable();
            $table->text('medical_history')->nullable();
            $table->string('main_savings_goal')->nullable();
            $table->text('personal_interests')->nullable();
            $table->text('personal_likes')->nullable();
            $table->boolean('smokes')->default(false);
            $table->boolean('drinks')->default(false);
            $table->string('personality')->nullable();
            $table->integer('children_count')->default(0);
            $table->jsonb('children_names')->nullable();
            $table->jsonb('children_birthdates')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            $table->index('client_id');
        });
        
    }

    public function down(): void
    {
        Schema::dropIfExists('insureds');
    }
};
