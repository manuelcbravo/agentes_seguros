<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->string('status', 20)->default('borrador')->change();
        });

        DB::statement("UPDATE policies SET status = 'borrador' WHERE status IS NULL OR status = '' OR status NOT IN ('borrador','activo','caducada')");

        DB::statement("ALTER TABLE policies ADD CONSTRAINT policies_status_check CHECK (status IN ('borrador','activo','caducada'))");

        if (Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->index(['agent_id', 'status'], 'policies_agent_id_status_index');
            });
        } else {
            Schema::table('policies', function (Blueprint $table) {
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropIndex('policies_agent_id_status_index');
            });
        } else {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropIndex(['status']);
            });
        }

        DB::statement('ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_status_check');

        DB::statement('ALTER TABLE policies ALTER COLUMN status DROP DEFAULT');
    }
};
