<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('disk', 30)->default('public');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->uuid('related_uuid')->nullable();
            $table->string('related_table')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
