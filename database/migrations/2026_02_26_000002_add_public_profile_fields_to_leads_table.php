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

        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE leads MODIFY source ENUM('facebook','google','whatsapp','referral','landing','other','perfil_web') NOT NULL");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE leads MODIFY source ENUM('facebook','google','whatsapp','referral','landing','other') NOT NULL");
        }

        Schema::table('leads', function (Blueprint $table): void {
            $table->dropColumn(['message', 'metadata']);
        });
    }
};
