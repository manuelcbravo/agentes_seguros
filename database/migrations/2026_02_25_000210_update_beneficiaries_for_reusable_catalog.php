<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (Schema::hasColumn('beneficiaries', 'policy_id')) {
                $table->uuid('policy_id')->nullable()->change();
            }

            if (! Schema::hasColumn('beneficiaries', 'phone')) {
                $table->string('phone', 30)->nullable()->after('rfc');
            }

            if (! Schema::hasColumn('beneficiaries', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (Schema::hasColumn('beneficiaries', 'email')) {
                $table->dropColumn('email');
            }

            if (Schema::hasColumn('beneficiaries', 'phone')) {
                $table->dropColumn('phone');
            }

            if (Schema::hasColumn('beneficiaries', 'policy_id')) {
                $table->uuid('policy_id')->nullable(false)->change();
            }
        });
    }
};
