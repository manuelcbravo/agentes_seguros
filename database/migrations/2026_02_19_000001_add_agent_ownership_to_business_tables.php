<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('insureds') && ! Schema::hasColumn('insureds', 'agent_id')) {
            Schema::table('insureds', function (Blueprint $table) {
                $table->foreignUuid('agent_id')
                    ->nullable()
                    ->after('client_id')
                    ->constrained('agents')
                    ->nullOnDelete()
                    ->index();
            });
        }

        if (Schema::hasTable('policies') && ! Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->foreignUuid('agent_id')
                    ->nullable()
                    ->after('insured_id')
                    ->constrained('agents')
                    ->nullOnDelete()
                    ->index();
            });
        }

        if (Schema::hasTable('beneficiaries') && ! Schema::hasColumn('beneficiaries', 'agent_id')) {
            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->foreignUuid('agent_id')
                    ->nullable()
                    ->after('policy_id')
                    ->constrained('agents')
                    ->nullOnDelete()
                    ->index();
            });
        }

        if (Schema::hasTable('leads') && ! Schema::hasColumn('leads', 'agent_id')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->foreignUuid('agent_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('agents')
                    ->nullOnDelete()
                    ->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('insureds') && Schema::hasColumn('insureds', 'agent_id')) {
            Schema::table('insureds', function (Blueprint $table) {
                $table->dropConstrainedForeignId('agent_id');
            });
        }

        if (Schema::hasTable('policies') && Schema::hasColumn('policies', 'agent_id')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropConstrainedForeignId('agent_id');
            });
        }

        if (Schema::hasTable('beneficiaries') && Schema::hasColumn('beneficiaries', 'agent_id')) {
            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropConstrainedForeignId('agent_id');
            });
        }

        if (Schema::hasTable('leads') && Schema::hasColumn('leads', 'agent_id')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->dropConstrainedForeignId('agent_id');
            });
        }
    }
};
