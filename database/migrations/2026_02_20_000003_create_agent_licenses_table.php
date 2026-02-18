<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_id');
            $table->uuid('aseguradora_id');
            $table->string('num_licencia', 120);
            $table->date('fecha_expiracion');
            $table->date('fecha_emision');
            $table->string('status', 30)->default('vigente');
            $table->text('observaciones')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('agent_id')->references('id')->on('agents')->cascadeOnDelete();
            $table->foreign('aseguradora_id')->references('id')->on('cat_insurance_companies')->cascadeOnDelete();

            $table->index('agent_id');
            $table->index('aseguradora_id');
            $table->index('status');
            $table->unique(['aseguradora_id', 'num_licencia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_licenses');
    }
};
