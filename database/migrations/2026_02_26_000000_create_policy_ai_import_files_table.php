<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_ai_import_files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('policy_ai_import_id')->index();
            $table->uuid('agent_id')->index();
            $table->string('original_filename');
            $table->string('mime_type', 120);
            $table->string('disk', 80);
            $table->string('path');
            $table->unsignedBigInteger('size')->nullable();
            $table->timestamps();

            $table->foreign('policy_ai_import_id')
                ->references('id')
                ->on('policy_ai_imports')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_ai_import_files');
    }
};
