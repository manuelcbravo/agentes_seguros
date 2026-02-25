<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            if (! Schema::hasColumn('policies', 'policy_number')) {
                $table->string('policy_number', 64)->nullable()->after('product_id');
                $table->index(['agent_id', 'policy_number']);
            }
        });

        if (! Schema::hasTable('beneficiary_policy')) {
            Schema::create('beneficiary_policy', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('policy_id')->constrained('policies')->cascadeOnDelete();
                $table->foreignUuid('beneficiary_id')->constrained('beneficiaries')->cascadeOnDelete();
                $table->decimal('percentage', 5, 2);
                $table->timestamps();

                $table->unique(['policy_id', 'beneficiary_id']);
                $table->index(['policy_id', 'percentage']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('beneficiary_policy')) {
            Schema::drop('beneficiary_policy');
        }

        Schema::table('policies', function (Blueprint $table) {
            if (Schema::hasColumn('policies', 'policy_number')) {
                $table->dropIndex(['agent_id', 'policy_number']);
                $table->dropColumn('policy_number');
            }
        });
    }
};
