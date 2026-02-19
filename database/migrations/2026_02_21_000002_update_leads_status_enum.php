<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contactado','perfilado','en_pausa','seguimiento','en_tramite','ganado','no_interesado') NOT NULL DEFAULT 'nuevo'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE leads MODIFY status ENUM('nuevo','contactado','cotizacion_enviada','negociacion','ganado','perdido') NOT NULL DEFAULT 'nuevo'");
    }
};
