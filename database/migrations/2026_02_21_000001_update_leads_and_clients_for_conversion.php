<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (! Schema::hasColumn('clients', 'agent_id')) {
                $table->foreignUuid('agent_id')
                    ->nullable()
                    ->after('company_id')
                    ->constrained('agents')
                    ->nullOnDelete()
                    ->index();
            }
        });

        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'uuid')) {
                $table->uuid('uuid')->nullable()->after('id')->unique();
            }

            if (! Schema::hasColumn('leads', 'client_id')) {
                $table->uuid('client_id')->nullable()->after('agent_id')->index();
                $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            }

            if (! Schema::hasColumn('leads', 'converted_at')) {
                $table->timestamp('converted_at')->nullable()->after('client_id');
            }
        });

        DB::table('leads')->whereNull('uuid')->orderBy('id')->chunkById(100, function ($leads) {
            foreach ($leads as $lead) {
                DB::table('leads')->where('id', $lead->id)->update(['uuid' => (string) Str::uuid()]);
            }
        });

        DB::table('leads')
            ->where('status', 'contacto_intento')
            ->update(['status' => 'contactado']);

        DB::table('leads')
            ->where('status', 'cotizacion_enviada')
            ->update(['status' => 'seguimiento']);
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'converted_at')) {
                $table->dropColumn('converted_at');
            }

            if (Schema::hasColumn('leads', 'client_id')) {
                $table->dropForeign(['client_id']);
                $table->dropColumn('client_id');
            }

            if (Schema::hasColumn('leads', 'uuid')) {
                $table->dropUnique('leads_uuid_unique');
                $table->dropColumn('uuid');
            }
        });

        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'agent_id')) {
                $table->dropConstrainedForeignId('agent_id');
            }
        });
    }
};
