<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->string('table_id', 80)->after('size');
            $table->unsignedBigInteger('related_id')->after('table_id');

            $table->index(['table_id', 'related_id']);
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropIndex(['table_id', 'related_id']);
            $table->dropColumn(['table_id', 'related_id']);
        });
    }
};
