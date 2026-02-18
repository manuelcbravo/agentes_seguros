<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('insurance_company_id');
            $table->uuid('product_type_id');
            $table->string('code', 50)->unique();
            $table->string('name', 150)->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->index('insurance_company_id');
            $table->index('product_type_id');

            $table->foreign('insurance_company_id')->references('id')->on('cat_insurance_companies')->cascadeOnDelete();
            $table->foreign('product_type_id')->references('id')->on('cat_product_types')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
