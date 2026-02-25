<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_ai_imports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_id')->index();
            $table->string('original_filename');
            $table->string('mime_type', 120);
            $table->string('disk', 80);
            $table->string('path');
            $table->enum('status', ['uploaded', 'processing', 'ready', 'needs_review', 'failed'])->default('uploaded')->index();
            $table->longText('extracted_text')->nullable();
            $table->json('ai_data')->nullable();
            $table->json('ai_confidence')->nullable();
            $table->json('missing_fields')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('took_ms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_ai_imports');
    }
};
