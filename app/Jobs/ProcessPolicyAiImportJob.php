<?php

namespace App\Jobs;

use App\Models\PolicyAiImport;
use App\Services\PolicyAI\PolicyAiOpenAiProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessPolicyAiImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $importId, public bool $force = false) {}

    public function handle(PolicyAiOpenAiProcessor $processor): void
    {
        $import = PolicyAiImport::query()->with('files')->find($this->importId);

        if (! $import) {
            Log::warning('Policy AI import job skipped because import was not found', [
                'import_id' => $this->importId,
            ]);

            return;
        }

        if (! $this->force && in_array($import->status, [PolicyAiImport::STATUS_PROCESSING, PolicyAiImport::STATUS_READY], true)) {
            Log::info('Policy AI import job skipped because status is already in progress or completed', [
                'import_id' => $import->id,
                'status' => $import->status,
            ]);

            return;
        }

        Log::info('Policy AI import job started', [
            'import_id' => $import->id,
            'force' => $this->force,
        ]);

        $startedAt = microtime(true);

        $import->update([
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'processing_started_at' => $import->processing_started_at ?? now(),
            'processing_heartbeat_at' => now(),
            'processing_ended_at' => null,
            'error_message' => null,
        ]);

        try {
            $this->markStage($import, 'uploading_files', 20);
            $this->markStage($import, 'ai_request', 60);

            $result = $processor->process($import);

            $this->markStage($import, 'parsing', 80);
            $this->markStage($import, 'saving', 95);

            $import->update([
                'status' => $result['status'],
                'ai_data' => $result['ai_data'],
                'missing_fields' => $result['missing_fields'],
                'error_message' => null,
                'processing_ended_at' => now(),
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            $this->markStage($import, 'done', 100);

            Log::info('Policy AI import job finished', [
                'import_id' => $import->id,
                'status' => $result['status'],
            ]);
        } catch (Throwable $exception) {
            Log::error('Policy AI import job failed', [
                'import_id' => $import->id,
                'message' => $exception->getMessage(),
            ]);
            $import->update([
                'status' => PolicyAiImport::STATUS_FAILED,
                'processing_stage' => 'failed',
                'error_message' => $exception->getMessage(),
                'processing_heartbeat_at' => now(),
                'processing_ended_at' => now(),
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);
        }
    }

    private function markStage(PolicyAiImport $import, string $stage, int $progress): void
    {
        $import->update([
            'processing_stage' => $stage,
            'progress' => $progress,
            'processing_heartbeat_at' => now(),
        ]);
    }
}
