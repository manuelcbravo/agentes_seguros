<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiary_policy', function (Blueprint $table) {
            if (! Schema::hasColumn('beneficiary_policy', 'relationship_id')) {
                $table->unsignedBigInteger('relationship_id')->nullable()->after('percentage');
                $table->index('relationship_id');
                $table->foreign('relationship_id')->references('id')->on('cat_relationships');
            }
        });

        if (Schema::hasColumn('beneficiaries', 'relationship_id')) {
            $relationshipByBeneficiary = DB::table('beneficiaries')
                ->whereNotNull('relationship_id')
                ->pluck('relationship_id', 'id');

            DB::table('beneficiary_policy')
                ->whereNull('relationship_id')
                ->select(['id', 'beneficiary_id'])
                ->orderBy('created_at')
                ->chunk(250, function ($rows) use ($relationshipByBeneficiary) {
                    foreach ($rows as $row) {
                        $relationshipId = $relationshipByBeneficiary->get($row->beneficiary_id);

                        if ($relationshipId === null) {
                            continue;
                        }

                        DB::table('beneficiary_policy')
                            ->where('id', $row->id)
                            ->update(['relationship_id' => $relationshipId]);
                    }
                });

            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropColumn('relationship_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (! Schema::hasColumn('beneficiaries', 'relationship_id')) {
                $table->unsignedBigInteger('relationship_id')->nullable()->after('personality');
            }
        });

        DB::table('beneficiary_policy')
            ->whereNotNull('relationship_id')
            ->select(['beneficiary_id', 'relationship_id'])
            ->orderBy('beneficiary_id')
            ->chunk(250, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('beneficiaries')
                        ->where('id', $row->beneficiary_id)
                        ->whereNull('relationship_id')
                        ->update(['relationship_id' => $row->relationship_id]);
                }
            });

        Schema::table('beneficiary_policy', function (Blueprint $table) {
            if (Schema::hasColumn('beneficiary_policy', 'relationship_id')) {
                $table->dropForeign(['relationship_id']);
                $table->dropIndex(['relationship_id']);
                $table->dropColumn('relationship_id');
            }
        });
    }
};
