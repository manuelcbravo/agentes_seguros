<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')
                ->constrained('agents')
                ->index();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->enum('source', ['facebook', 'google', 'whatsapp', 'referral', 'landing', 'other']);
            $table->enum('status', ['nuevo', 'contactado', 'cotizacion_enviada', 'negociacion', 'ganado', 'perdido'])->default('nuevo');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
