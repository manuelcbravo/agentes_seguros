<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_id')->unique();

            $table->string('display_name');
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->string('cover_image_path')->nullable();
            $table->string('brand_color', 20)->nullable();
            $table->string('logo_path')->nullable();

            $table->string('email_public')->nullable();
            $table->string('phone_public', 60)->nullable();
            $table->string('whatsapp_public', 60)->nullable();
            $table->string('website_url')->nullable();
            $table->string('address_public')->nullable();
            $table->string('city', 120)->nullable();
            $table->string('state', 120)->nullable();
            $table->json('service_areas')->nullable();
            $table->json('languages')->nullable();
            $table->json('working_hours')->nullable();

            $table->json('specialties')->nullable();
            $table->json('insurers')->nullable();
            $table->string('cta_title')->nullable();
            $table->string('cta_description')->nullable();

            $table->string('public_slug')->unique();
            $table->boolean('is_public_enabled')->default(false);
            $table->boolean('contact_form_enabled')->default(true);
            $table->boolean('show_licenses')->default(true);

            $table->timestamp('last_published_at')->nullable();
            $table->timestamps();

            $table->foreign('agent_id')->references('id')->on('agents')->cascadeOnDelete();
            $table->index('is_public_enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_profiles');
    }
};
