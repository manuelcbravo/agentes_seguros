<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->uuid('currency_id')->nullable();
            $table->index('currency_id');
            $table->foreign('currency_id')->references('id')->on('cat_currencies')->nullOnDelete();
        });

        Schema::table('insureds', function (Blueprint $table) {
            $table->uuid('marital_status_id')->nullable();
            $table->uuid('sex_id')->nullable();
            $table->index('marital_status_id');
            $table->index('sex_id');
            $table->foreign('marital_status_id')->references('id')->on('cat_marital_statuses')->nullOnDelete();
            $table->foreign('sex_id')->references('id')->on('cat_sexes')->nullOnDelete();
        });

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->uuid('relationship_id')->nullable();
            $table->index('relationship_id');
            $table->foreign('relationship_id')->references('id')->on('cat_relationships')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropForeign(['relationship_id']);
            $table->dropIndex(['relationship_id']);
            $table->dropColumn('relationship_id');
        });

        Schema::table('insureds', function (Blueprint $table) {
            $table->dropForeign(['marital_status_id']);
            $table->dropForeign(['sex_id']);
            $table->dropIndex(['marital_status_id']);
            $table->dropIndex(['sex_id']);
            $table->dropColumn(['marital_status_id', 'sex_id']);
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropIndex(['currency_id']);
            $table->dropColumn('currency_id');
        });
    }
};
