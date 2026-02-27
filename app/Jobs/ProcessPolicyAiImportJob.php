<?php

namespace App\Jobs;

use App\Models\PolicyAiImport;
use App\Models\PolicyAiImportFile;
use App\Services\PolicyAI\PolicyAiExtractorService;
use App\Services\PolicyAi\PolicyAiMapper;
use App\Services\PolicyAi\TextExtraction\OcrTextExtractor;
use App\Services\PolicyAi\TextExtraction\PdfTextExtractor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ProcessPolicyAiImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $importId, public bool $force = false) {}

    public function handle(PolicyAiExtractorService $extractorService, PolicyAiMapper $mapper): void
    {
        $import = PolicyAiImport::query()->with('files')->find($this->importId);

        if (! $import) {
            return;
        }

        if (! $this->force && in_array($import->status, [PolicyAiImport::STATUS_PROCESSING, PolicyAiImport::STATUS_READY], true)) {
            return;
        }

        $startedAt = microtime(true);

        $this->updateProcessingState($import, 'extracting_text', 20, [
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'error_message' => null,
        ]);

        try {
            if ($import->files->isEmpty()) {
                throw new RuntimeException('No se encontraron archivos para analizar.');
            }

            $pdfExtractor = new PdfTextExtractor();
            $ocrExtractor = new OcrTextExtractor();
            $chunks = [];

            foreach ($import->files as $file) {
                $fileText = $this->extractForFile($file, $pdfExtractor, $ocrExtractor);
                if ($fileText !== null && trim($fileText) !== '') {
                    $chunks[] = "--- FILE: {$file->original_filename} ---\n\n".trim($fileText);
                }
            }

            $text = trim(implode("\n\n", $chunks));

            if ($text === '') {
                throw new RuntimeException('No se pudo extraer texto de los archivos.');
            }

            $this->updateProcessingState($import, 'ai_request', 65);

            $aiData = $extractorService->extract($text);
            $confidence = $this->buildConfidence($aiData);
            $missingFields = $this->criticalMissingFields($aiData);
            $status = count($missingFields) >= 2
                ? PolicyAiImport::STATUS_NEEDS_REVIEW
                : PolicyAiImport::STATUS_READY;

            $this->updateProcessingState($import, 'saving', 90);

            $import->update([
                'status' => $status,
                'processing_stage' => 'completed',
                'progress' => 100,
                'processing_heartbeat_at' => now(),
                'extracted_text' => $text,
                'ai_data' => array_merge($aiData, [
                    'meta' => $mapper->toWizardDraft($aiData, (string) $import->agent_id)['meta'] ?? [],
                ]),
                'ai_confidence' => $confidence,
                'missing_fields' => $missingFields,
                'error_message' => null,
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);
        } catch (Throwable $exception) {
            $message = str_contains(mb_strtolower($exception->getMessage()), 'ocr')
                ? 'OCR no configurado para analizar imágenes o PDFs escaneados.'
                : $exception->getMessage();

            $import->update([
                'status' => PolicyAiImport::STATUS_FAILED,
                'processing_stage' => 'failed',
                'progress' => 100,
                'processing_heartbeat_at' => now(),
                'error_message' => $message,
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);
        }
    }

    private function extractForFile(PolicyAiImportFile $file, PdfTextExtractor $pdfExtractor, OcrTextExtractor $ocrExtractor): ?string
    {
        $disk = $file->disk ?: 's3';
        $exists = Storage::disk($disk)->exists($file->path);

        Log::info('Procesando archivo IA', [
            'file_id' => $file->id,
            'disk' => $disk,
            'path' => $file->path,
            'exists' => $exists,
        ]);

        if (! $exists) {
            throw new RuntimeException('No se pudo acceder al archivo en S3. Verifica configuración del disk.');
        }

        $temporaryRelativePath = 'tmp/policy-ai/'.Str::uuid().'-'.basename($file->path);
        Storage::disk('local')->put($temporaryRelativePath, Storage::disk($disk)->get($file->path));
        $fullPath = Storage::disk('local')->path($temporaryRelativePath);

        try {
            $text = $pdfExtractor->extract($fullPath, $file->mime_type);

            if (! $text || mb_strlen($text) < 80) {
                $text = $ocrExtractor->extract($fullPath, $file->mime_type);
            }

            return $text;
        } finally {
            Storage::disk('local')->delete($temporaryRelativePath);
        }
    }

    private function criticalMissingFields(array $data): array
    {
        $missing = [];

        if (blank(data_get($data, 'policy.policy_number'))) {
            $missing[] = 'policy.policy_number';
        }

        if (blank(data_get($data, 'policy.insurer_name'))) {
            $missing[] = 'policy.insurer_name';
        }

        if (blank(data_get($data, 'policy.valid_from'))) {
            $missing[] = 'policy.valid_from';
        }

        if (blank(data_get($data, 'policy.valid_to'))) {
            $missing[] = 'policy.valid_to';
        }

        if (blank(data_get($data, 'contractor.first_name')) || blank(data_get($data, 'contractor.last_name'))) {
            $missing[] = 'contractor.full_name';
        }

        return $missing;
    }

    private function buildConfidence(array $data): array
    {
        $score = fn (array $values) => round(collect($values)->filter(fn ($value) => ! blank($value))->count() / max(count($values), 1), 2);

        $contractor = data_get($data, 'contractor', []);
        $insured = data_get($data, 'insured', []);
        $policy = data_get($data, 'policy', []);

        return [
            'sections' => [
                'contractor' => $score([$contractor['first_name'] ?? null, $contractor['last_name'] ?? null, $contractor['rfc'] ?? null, $contractor['email'] ?? null]),
                'insured' => $score([$insured['first_name'] ?? null, $insured['last_name'] ?? null, $insured['rfc'] ?? null]),
                'policy' => $score([$policy['insurer_name'] ?? null, $policy['policy_number'] ?? null, $policy['valid_from'] ?? null, $policy['valid_to'] ?? null]),
                'beneficiaries' => $score(data_get($data, 'beneficiaries', [])),
            ],
            'fields' => [
                'policy.policy_number' => ! blank(data_get($data, 'policy.policy_number')) ? 1 : 0,
                'policy.valid_from' => ! blank(data_get($data, 'policy.valid_from')) ? 1 : 0,
                'policy.valid_to' => ! blank(data_get($data, 'policy.valid_to')) ? 1 : 0,
                'policy.insurer_name' => ! blank(data_get($data, 'policy.insurer_name')) ? 1 : 0,
                'contractor.full_name' => (! blank(data_get($data, 'contractor.first_name')) && ! blank(data_get($data, 'contractor.last_name'))) ? 1 : 0,
            ],
        ];
    }

    private function updateProcessingState(PolicyAiImport $import, string $stage, int $progress, array $extra = []): void
    {
        $import->update(array_merge([
            'processing_stage' => $stage,
            'progress' => $progress,
            'processing_heartbeat_at' => now(),
        ], $extra));
    }
}
