<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_ai_imports', function (Blueprint $table) {
            $table->string('processing_stage', 80)->nullable()->after('status');
            $table->unsignedTinyInteger('progress')->default(0)->after('processing_stage');
            $table->timestamp('processing_heartbeat_at')->nullable()->after('progress');
        });
    }

    public function down(): void
    {
        Schema::table('policy_ai_imports', function (Blueprint $table) {
            $table->dropColumn(['processing_stage', 'progress', 'processing_heartbeat_at']);
        });
    }
};
