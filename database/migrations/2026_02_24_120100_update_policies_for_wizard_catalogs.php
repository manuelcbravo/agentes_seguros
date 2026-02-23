<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            if (! Schema::hasColumn('policies', 'current_step')) {
                $table->unsignedTinyInteger('current_step')->default(1)->after('status');
            }

            if (! Schema::hasColumn('policies', 'periodicity_id')) {
                $table->foreignId('periodicity_id')->nullable()->after('periodicity')->constrained('cat_periodicities')->nullOnDelete();
            }

            if (! Schema::hasColumn('policies', 'insurance_company_id')) {
                $table->foreignUuid('insurance_company_id')->nullable()->after('product')->constrained('cat_insurance_companies')->nullOnDelete();
            }

            if (! Schema::hasColumn('policies', 'product_id')) {
                $table->foreignUuid('product_id')->nullable()->after('insurance_company_id')->constrained('products')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            if (Schema::hasColumn('policies', 'product_id')) {
                $table->dropConstrainedForeignId('product_id');
            }
            if (Schema::hasColumn('policies', 'insurance_company_id')) {
                $table->dropConstrainedForeignId('insurance_company_id');
            }
            if (Schema::hasColumn('policies', 'periodicity_id')) {
                $table->dropForeign(['periodicity_id']);
                $table->dropColumn('periodicity_id');
            }
            if (Schema::hasColumn('policies', 'current_step')) {
                $table->dropColumn('current_step');
            }
        });
    }
};
