<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                if (! Schema::hasColumn('leads', 'client_id')) {
                    $table->uuid('client_id')->nullable()->after('agent_id');
                    $table->index('client_id');
                }

                if (! Schema::hasColumn('leads', 'converted_at')) {
                    $table->timestamp('converted_at')->nullable()->after('status');
                }
            });

            Schema::table('leads', function (Blueprint $table) {
                $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            });

            DB::table('leads')->whereIn('status', ['contacto_intento', 'cotizacion_enviada'])->update(['status' => 'en_pausa']);
            DB::table('leads')->where('status', 'negociacion')->update(['status' => 'seguimiento']);
            DB::table('leads')->where('status', 'perdido')->update(['status' => 'no_interesado']);
            DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contactado','perfilado','en_pausa','seguimiento','en_tramite','ganado','no_interesado') NOT NULL DEFAULT 'nuevo'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('leads')) {
            DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contacto_intento','contactado','perfilado','cotizacion_enviada','seguimiento','en_tramite','ganado','no_interesado') NOT NULL DEFAULT 'nuevo'");

            Schema::table('leads', function (Blueprint $table) {
                if (Schema::hasColumn('leads', 'client_id')) {
                    $table->dropForeign(['client_id']);
                    $table->dropIndex(['client_id']);
                    $table->dropColumn('client_id');
                }

                if (Schema::hasColumn('leads', 'converted_at')) {
                    $table->dropColumn('converted_at');
                }
            });
        }
    }
};
