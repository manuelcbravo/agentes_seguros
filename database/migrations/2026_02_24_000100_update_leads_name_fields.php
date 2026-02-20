<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'middle_name')) {
                $table->string('middle_name', 150)->nullable()->after('first_name');
            }

            if (! Schema::hasColumn('leads', 'second_last_name')) {
                $table->string('second_last_name', 150)->nullable()->after('last_name');
            }
        });

        DB::statement("ALTER TABLE leads ALTER COLUMN first_name TYPE VARCHAR(150)");
        DB::statement("UPDATE leads SET first_name = '-' WHERE first_name IS NULL OR btrim(first_name) = ''");

        DB::statement("ALTER TABLE leads ALTER COLUMN last_name TYPE VARCHAR(150)");
        DB::statement("UPDATE leads SET last_name = '-' WHERE last_name IS NULL OR btrim(last_name) = ''");
        DB::statement("ALTER TABLE leads ALTER COLUMN last_name SET NOT NULL");

        if (Schema::hasColumn('leads', 'name')) {
            DB::table('leads')
                ->whereNull('first_name')
                ->orWhere('first_name', '')
                ->update(['first_name' => DB::raw("COALESCE(NULLIF(name, ''), '-')")]);

            DB::table('leads')
                ->whereNull('last_name')
                ->orWhere('last_name', '')
                ->update(['last_name' => '-']);

            Schema::table('leads', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'name')) {
                $table->string('name')->nullable();
            }
        });

        DB::statement("UPDATE leads SET name = trim(concat_ws(' ', first_name, middle_name, last_name, second_last_name))");

        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'middle_name')) {
                $table->dropColumn('middle_name');
            }

            if (Schema::hasColumn('leads', 'second_last_name')) {
                $table->dropColumn('second_last_name');
            }
        });

        DB::statement("ALTER TABLE leads ALTER COLUMN first_name TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE leads ALTER COLUMN last_name TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE leads ALTER COLUMN last_name DROP NOT NULL");
    }
};
