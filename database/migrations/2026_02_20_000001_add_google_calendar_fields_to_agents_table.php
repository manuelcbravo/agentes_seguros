<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->text('google_access_token')->nullable()->after('state');
            $table->text('google_refresh_token')->nullable()->after('google_access_token');
            $table->timestamp('google_token_expires_at')->nullable()->after('google_refresh_token');
            $table->string('google_calendar_id')->nullable()->after('google_token_expires_at');
            $table->string('google_email')->nullable()->after('google_calendar_id');
            $table->jsonb('google_scopes')->nullable()->after('google_email');
            $table->timestamp('google_connected_at')->nullable()->after('google_scopes');
            $table->timestamp('google_disconnected_at')->nullable()->after('google_connected_at');
            $table->timestamp('google_last_sync_at')->nullable()->after('google_disconnected_at');

            $table->index('google_email');
            $table->index('google_connected_at');
        });
    }

    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->dropIndex(['google_email']);
            $table->dropIndex(['google_connected_at']);

            $table->dropColumn([
                'google_access_token',
                'google_refresh_token',
                'google_token_expires_at',
                'google_calendar_id',
                'google_email',
                'google_scopes',
                'google_connected_at',
                'google_disconnected_at',
                'google_last_sync_at',
            ]);
        });
    }
};

