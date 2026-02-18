<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Multi tenant (por si luego lo necesitas)
            $table->foreignId('company_id')->nullable()->index();

            // ===== DATOS PERSONALES =====
            $table->string('first_name', 150);
            $table->string('middle_name', 150)->nullable();
            $table->string('last_name', 150);
            $table->string('second_last_name', 150)->nullable();

            $table->date('birth_date')->nullable();
            $table->unsignedTinyInteger('age')->nullable();

            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_say'])->nullable();

            // ===== IDENTIFICACIÓN LEGAL =====
            $table->string('curp', 18)->nullable()->index();
            $table->string('rfc', 20)->nullable()->index();
            $table->string('tax_regime', 100)->nullable();

            // ===== CONTACTO =====
            $table->string('email')->nullable()->index();
            $table->string('email_verified_at')->nullable();

            $table->string('phone', 30)->nullable();

            // ===== DIRECCIÓN =====
            $table->string('street', 255)->nullable();
            $table->string('ext_number', 20)->nullable();
            $table->string('int_number', 20)->nullable();
            $table->string('neighborhood', 150)->nullable();
            $table->string('city', 150)->nullable();
            $table->string('state', 150)->nullable();
            $table->string('country', 150)->nullable();
            $table->string('postal_code', 20)->nullable();

            // ===== PERFIL DIGITAL =====
            $table->string('avatar_path')->nullable();

            // ===== CRM =====
            $table->string('source', 100)->nullable(); // web, fb, referral, etc
            $table->string('campaign', 150)->nullable();
            $table->string('sales_stage', 100)->nullable();
            $table->decimal('lifetime_value', 12, 2)->default(0);

            $table->date('first_contact_at')->nullable();
            $table->date('last_contact_at')->nullable();
            $table->date('next_followup_at')->nullable();

            // ===== ESTADO =====
            $table->boolean('is_active')->default(true);
            $table->boolean('is_blacklisted')->default(false);

            // ===== DOCUMENTOS =====
            $table->json('documents')->nullable();

            // ===== METADATA =====
            $table->json('extra_attributes')->nullable();

            // ===== AUDITORÍA =====
           $table->userstampsUuid();
            $table->userstampsUuidSoftDeletes();

            // ===== CONTROL =====
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
