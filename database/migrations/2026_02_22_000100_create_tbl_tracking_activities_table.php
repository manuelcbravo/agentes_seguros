<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_tracking_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_id')->index();
            $table->uuidMorphs('trackable');
            $table->foreignId('activity_type_id')->constrained('cat_tracking_activity_types');
            $table->foreignId('channel_id')->nullable()->constrained('cat_tracking_channels');
            $table->foreignId('status_id')->constrained('cat_tracking_statuses');
            $table->foreignId('priority_id')->nullable()->constrained('cat_tracking_priorities');
            $table->foreignId('outcome_id')->nullable()->constrained('cat_tracking_outcomes');
            $table->string('title')->nullable();
            $table->text('body');
            $table->timestamp('occurred_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('next_action_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->jsonb('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('agent_id')->references('id')->on('agents')->cascadeOnDelete();
            $table->index(['agent_id', 'trackable_type', 'trackable_id'], 'tracking_agent_trackable_idx');
            $table->index(['agent_id', 'next_action_at']);
            $table->index(['agent_id', 'status_id']);
            $table->index(['agent_id', 'activity_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_tracking_activities');
    }
};

