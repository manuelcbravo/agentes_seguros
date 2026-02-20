<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insureds', function (Blueprint $table) {
            $table->string('first_name', 150)->default('-')->after('client_id');
            $table->string('middle_name', 150)->nullable()->after('first_name');
            $table->string('last_name', 150)->default('-')->after('middle_name');
            $table->string('second_last_name', 150)->nullable()->after('last_name');
        });

        DB::statement("UPDATE insureds AS i SET first_name = COALESCE(NULLIF(c.first_name, ''), '-'), middle_name = NULLIF(c.middle_name, ''), last_name = COALESCE(NULLIF(c.last_name, ''), '-'), second_last_name = NULLIF(c.second_last_name, '') FROM clients AS c WHERE i.client_id = c.id");
        DB::statement("UPDATE insureds SET first_name = '-' WHERE first_name IS NULL OR btrim(first_name) = ''");
        DB::statement("UPDATE insureds SET last_name = '-' WHERE last_name IS NULL OR btrim(last_name) = ''");

        if (Schema::hasColumn('insureds', 'name')) {
            DB::statement("UPDATE insureds SET first_name = COALESCE(NULLIF(name, ''), first_name)");
            Schema::table('insureds', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    public function down(): void
    {
        Schema::table('insureds', function (Blueprint $table) {
            if (! Schema::hasColumn('insureds', 'name')) {
                $table->string('name')->nullable()->after('client_id');
            }
        });

        DB::statement("UPDATE insureds SET name = trim(concat_ws(' ', first_name, middle_name, last_name, second_last_name))");

        Schema::table('insureds', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_name', 'last_name', 'second_last_name']);
        });
    }
};
