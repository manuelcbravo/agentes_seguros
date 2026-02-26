<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profile_view_stats', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('views_total')->default(0);
            $table->unsignedInteger('views_unique')->default(0);
            $table->timestamps();

            $table->unique(['agent_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_profile_view_stats');
    }
};
