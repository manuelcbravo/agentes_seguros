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
            $table->string('estatus', 20)
                ->default('borrador')
                ->after('status');
        });

        DB::table('policies')->whereNull('estatus')->update(['estatus' => 'borrador']);

        DB::statement("ALTER TABLE policies ADD CONSTRAINT policies_estatus_check CHECK (estatus IN ('borrador','activo','caducada'))");

        if (Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->index(['agent_id', 'estatus'], 'policies_agent_id_estatus_index');
            });
        } else {
            Schema::table('policies', function (Blueprint $table) {
                $table->index('estatus');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropIndex('policies_agent_id_estatus_index');
            });
        } else {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropIndex(['estatus']);
            });
        }

        DB::statement('ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_estatus_check');

        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn('estatus');
        });
    }
};
