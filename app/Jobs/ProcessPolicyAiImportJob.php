<?php

namespace App\Jobs;

use Throwable;
use App\Models\PolicyAiImport;
use Illuminate\Bus\Queueable;
use App\Services\PolicyAi\PolicyAiAnalyzer;
use App\Services\PolicyAi\TextExtraction\PdfTextExtractor;
use App\Services\PolicyAi\PolicyAiMapper;
use RuntimeException;
use App\Services\PolicyAi\TextExtraction\OcrTextExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ProcessPolicyAiImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $importId, public bool $force = false) {}

    public function handle(PolicyAiAnalyzer $analyzer, PolicyAiMapper $mapper): void
    {
        $import = PolicyAiImport::query()->find($this->importId);

        if (! $import) {
            return;
        }

        if (! $this->force && in_array($import->status, [PolicyAiImport::STATUS_PROCESSING, PolicyAiImport::STATUS_READY], true)) {
            return;
        }

        $startedAt = microtime(true);
        $import->update(['status' => PolicyAiImport::STATUS_PROCESSING, 'error_message' => null]);

        try {
            $fullPath = Storage::disk($import->disk)->path($import->path);
            $pdfExtractor = new PdfTextExtractor();
            $ocrExtractor = new OcrTextExtractor();

            $text = $pdfExtractor->extract($fullPath, $import->mime_type);

            if (! $text || mb_strlen($text) < 80) {
                $text = $ocrExtractor->extract($fullPath, $import->mime_type);
            }

            if (! $text) {
                throw new RuntimeException('No se pudo extraer texto del archivo.');
            }

            $aiData = $analyzer->analyze($text);
            $confidence = $this->buildConfidence($aiData);
            $missing = $this->criticalMissingFields($aiData);

            $criticalConfidence = min(
                data_get($confidence, 'sections.contractor', 0),
                data_get($confidence, 'sections.insured', 0),
                data_get($confidence, 'sections.policy', 0),
            );

            $status = empty($missing) && $criticalConfidence >= 0.60
                ? PolicyAiImport::STATUS_READY
                : PolicyAiImport::STATUS_NEEDS_REVIEW;

            $import->update([
                'status' => $status,
                'extracted_text' => $text,
                'ai_data' => array_merge($aiData, [
                    'meta' => $mapper->toWizardDraft($aiData, (string) $import->agent_id)['meta'] ?? [],
                ]),
                'ai_confidence' => $confidence,
                'missing_fields' => $missing,
                'error_message' => null,
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);
        } catch (Throwable $e) {
            $message = str_contains(mb_strtolower($e->getMessage()), 'ocr')
                ? 'OCR no configurado'
                : $e->getMessage();

            $import->update([
                'status' => PolicyAiImport::STATUS_FAILED,
                'error_message' => $message,
                'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);
        }
    }

    private function criticalMissingFields(array $data): array
    {
        $missing = [];

        if (blank(data_get($data, 'policy.policy_number'))) {
            $missing[] = 'policy.policy_number';
        }

        if (blank(data_get($data, 'policy.valid_from'))) {
            $missing[] = 'policy.valid_from';
        }

        if (blank(data_get($data, 'policy.valid_to'))) {
            $missing[] = 'policy.valid_to';
        }

        if (blank(data_get($data, 'policy.insurer_name'))) {
            $missing[] = 'policy.insurer_name';
        }

        if (blank(data_get($data, 'contractor.first_name')) || blank(data_get($data, 'contractor.last_name'))) {
            $missing[] = 'contractor.full_name';
        }

        if (blank(data_get($data, 'insured.first_name')) || blank(data_get($data, 'insured.last_name'))) {
            $missing[] = 'insured.full_name';
        }

        foreach (data_get($data, 'beneficiaries', []) as $index => $beneficiary) {
            if (! blank($beneficiary['name'] ?? null) && blank($beneficiary['percentage'] ?? null)) {
                $missing[] = "beneficiaries.{$index}.percentage";
            }
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
                'insured.full_name' => (! blank(data_get($data, 'insured.first_name')) && ! blank(data_get($data, 'insured.last_name'))) ? 1 : 0,
            ],
        ];
    }
}
