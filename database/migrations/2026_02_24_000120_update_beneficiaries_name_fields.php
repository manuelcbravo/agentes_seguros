<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->string('first_name', 150)->default('-')->after('policy_id');
            $table->string('middle_name', 150)->nullable()->after('first_name');
            $table->string('last_name', 150)->default('-')->after('middle_name');
            $table->string('second_last_name', 150)->nullable()->after('last_name');
        });

        if (Schema::hasColumn('beneficiaries', 'name')) {
            DB::statement("UPDATE beneficiaries SET first_name = COALESCE(NULLIF(name, ''), '-'), last_name = '-' WHERE name IS NOT NULL");

            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }

        DB::statement("UPDATE beneficiaries SET first_name = '-' WHERE first_name IS NULL OR btrim(first_name) = ''");
        DB::statement("UPDATE beneficiaries SET last_name = '-' WHERE last_name IS NULL OR btrim(last_name) = ''");
    }

    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (! Schema::hasColumn('beneficiaries', 'name')) {
                $table->string('name')->nullable()->after('policy_id');
            }
        });

        DB::statement("UPDATE beneficiaries SET name = trim(concat_ws(' ', first_name, middle_name, last_name, second_last_name))");

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_name', 'last_name', 'second_last_name']);
        });
    }
};
