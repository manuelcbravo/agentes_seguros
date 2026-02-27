<?php

namespace App\Console\Commands;

use App\Models\PolicyAiImport;
use Illuminate\Console\Command;

class FailStuckPolicyAiImports extends Command
{
    protected $signature = 'policy-ai:fail-stuck-imports';

    protected $description = 'Marks policy AI imports as failed when heartbeat is stale';

    public function handle(): int
    {
        $stuckImports = PolicyAiImport::query()
            ->where('status', PolicyAiImport::STATUS_PROCESSING)
            ->where(function ($query): void {
                $query->whereNull('processing_heartbeat_at')
                    ->orWhere('processing_heartbeat_at', '<=', now()->subMinutes(5));
            })
            ->get();

        if ($stuckImports->isEmpty()) {
            $this->info('No stuck imports found.');

            return self::SUCCESS;
        }

        foreach ($stuckImports as $import) {
            $import->update([
                'status' => PolicyAiImport::STATUS_FAILED,
                'processing_stage' => 'failed',
                'error_message' => 'Procesamiento expiró (worker detenido o error). Reintenta.',
                'processing_ended_at' => now(),
                'processing_heartbeat_at' => now(),
            ]);
        }

        $this->info("Marked {$stuckImports->count()} stuck import(s) as failed.");

        return self::SUCCESS;
    }
}
