<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('api_clients', function (Blueprint $table) {
            $table->string('activation_token')->nullable()->unique()->after('remember_token');
            $table->timestamp('activation_sent_at')->nullable()->after('activation_token');
            $table->timestamp('activated_at')->nullable()->after('activation_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('api_clients', function (Blueprint $table) {
            $table->dropColumn([
                'activation_token',
                'activation_sent_at',
                'activated_at',
            ]);
        });
    }
};
