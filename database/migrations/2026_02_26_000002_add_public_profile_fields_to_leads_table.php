<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->text('message')->nullable()->after('email');
            $table->json('metadata')->nullable()->after('status');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check');
            DB::statement("ALTER TABLE leads ADD CONSTRAINT leads_source_check CHECK (source IN ('facebook','google','whatsapp','referral','landing','other','perfil_web'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check');
            DB::statement("ALTER TABLE leads ADD CONSTRAINT leads_source_check CHECK (source IN ('facebook','google','whatsapp','referral','landing','other'))");
        }

        Schema::table('leads', function (Blueprint $table): void {
            $table->dropColumn(['message', 'metadata']);
        });
    }
};
