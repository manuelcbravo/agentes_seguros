<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_wizard_drafts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_id')->unique();
            $table->string('source_type', 80);
            $table->uuid('source_id')->nullable();
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_wizard_drafts');
    }
};
