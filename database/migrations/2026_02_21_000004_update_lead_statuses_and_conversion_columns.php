<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('leads')) {
            return;
        }

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

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE leads ALTER COLUMN status TYPE VARCHAR(40) USING status::text");
            DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'nuevo'");
            DB::statement("ALTER TABLE leads ALTER COLUMN status SET NOT NULL");
            DB::statement("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check");
            DB::statement("ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('nuevo','contactado','perfilado','en_pausa','seguimiento','en_tramite','ganado','no_interesado'))");

            return;
        }

        DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contactado','perfilado','en_pausa','seguimiento','en_tramite','ganado','no_interesado') NOT NULL DEFAULT 'nuevo'");
    }

    public function down(): void
    {
        if (! Schema::hasTable('leads')) {
            return;
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE leads ALTER COLUMN status TYPE VARCHAR(40) USING status::text");
            DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'nuevo'");
            DB::statement("ALTER TABLE leads ALTER COLUMN status SET NOT NULL");
            DB::statement("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check");
            DB::statement("ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('nuevo','contacto_intento','contactado','perfilado','cotizacion_enviada','seguimiento','en_tramite','ganado','no_interesado'))");
        } else {
            DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contacto_intento','contactado','perfilado','cotizacion_enviada','seguimiento','en_tramite','ganado','no_interesado') NOT NULL DEFAULT 'nuevo'");
        }

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
};