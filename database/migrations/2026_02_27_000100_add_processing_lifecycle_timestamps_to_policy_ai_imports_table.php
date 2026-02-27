<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_ai_imports', function (Blueprint $table) {
            $table->timestamp('processing_started_at')->nullable()->after('progress');
            $table->timestamp('processing_ended_at')->nullable()->after('processing_heartbeat_at');
        });
    }

    public function down(): void
    {
        Schema::table('policy_ai_imports', function (Blueprint $table) {
            $table->dropColumn(['processing_started_at', 'processing_ended_at']);
        });
    }
};
