<?php

namespace App\Services\PolicyAI;

use App\Models\PolicyAiImport;
use App\Models\PolicyAiImportFile;
use App\Services\OpenAI\OpenAiClient;
use Illuminate\Support\Facades\Storage;
use JsonException;
use RuntimeException;

class PolicyAiOpenAiProcessor
{
    public function __construct(private readonly OpenAiClient $openAiClient) {}

    public function process(PolicyAiImport $import): array
    {
        $files = $import->files;

        if ($files->isEmpty()) {
            throw new RuntimeException('No se encontraron archivos para analizar.');
        }

        $fileIds = $files
            ->map(fn (PolicyAiImportFile $file): string => $this->uploadImportFile($file))
            ->values()
            ->all();

        $responseText = $this->openAiClient->extractPolicyJsonWithFiles($this->systemPrompt(), $this->userPrompt(), $fileIds);
        $aiData = $this->normalizeData($this->decodeJson($responseText));
        $missingFields = $this->criticalMissingFields($aiData);

        return [
            'ai_data' => $aiData,
            'missing_fields' => $missingFields,
            'status' => count($missingFields) > 0 ? PolicyAiImport::STATUS_NEEDS_REVIEW : PolicyAiImport::STATUS_READY,
        ];
    }

    private function uploadImportFile(PolicyAiImportFile $file): string
    {
        $disk = $file->disk ?: 's3';

        if (! Storage::disk($disk)->exists($file->path)) {
            throw new RuntimeException('No se pudo acceder al archivo en S3. Verifica configuración del disk.');
        }

        $contents = Storage::disk($disk)->get($file->path);

        return $this->openAiClient->uploadFile(
            $file->original_filename,
            $file->mime_type ?: 'application/octet-stream',
            $contents,
        );
    }

    private function decodeJson(string $content): array
    {
        $start = strpos($content, '{');
        $end = strrpos($content, '}');

        if ($start === false || $end === false || $end < $start) {
            throw new RuntimeException('OpenAI no devolvió JSON válido');
        }

        $json = substr($content, $start, ($end - $start) + 1);

        try {
            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('OpenAI no devolvió JSON válido', previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('OpenAI no devolvió JSON válido');
        }

        return $decoded;
    }

    private function normalizeData(array $data): array
    {
        $template = $this->schemaTemplate();

        return [
            'contractor' => array_merge($template['contractor'], (array) ($data['contractor'] ?? [])),
            'insured' => array_merge($template['insured'], (array) ($data['insured'] ?? [])),
            'policy' => array_merge($template['policy'], (array) ($data['policy'] ?? [])),
            'beneficiaries' => $this->normalizeBeneficiaries($data['beneficiaries'] ?? []),
            'notes' => (string) ($data['notes'] ?? ''),
        ];
    }

    private function normalizeBeneficiaries(mixed $beneficiaries): array
    {
        if (! is_array($beneficiaries) || $beneficiaries === []) {
            return [['name' => '', 'percentage' => null]];
        }

        return collect($beneficiaries)
            ->map(fn ($beneficiary): array => [
                'name' => (string) data_get($beneficiary, 'name', ''),
                'percentage' => is_numeric(data_get($beneficiary, 'percentage'))
                    ? (float) data_get($beneficiary, 'percentage')
                    : null,
            ])
            ->values()
            ->all();
    }

    private function criticalMissingFields(array $data): array
    {
        $missing = [];

        if (blank(data_get($data, 'policy.insurer_name'))) {
            $missing[] = 'policy.insurer_name';
        }

        if (blank(data_get($data, 'policy.policy_number'))) {
            $missing[] = 'policy.policy_number';
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

        if (blank(data_get($data, 'insured.first_name')) || blank(data_get($data, 'insured.last_name'))) {
            $missing[] = 'insured.full_name';
        }

        return $missing;
    }

    private function systemPrompt(): string
    {
        return implode("\n", [
            'Eres un extractor de pólizas de seguros.',
            'Analiza los archivos adjuntos (PDF/imágenes).',
            'Devuelve SOLO JSON válido, sin markdown, sin explicaciones.',
            'Si un dato no existe, usa null o string vacío.',
            'Fechas en YYYY-MM-DD.',
            'policy_number puede ser alfanumérico/hex.',
        ]);
    }

    private function userPrompt(): string
    {
        return 'Extrae y devuelve el siguiente schema exactamente: '.json_encode($this->schemaTemplate(), JSON_UNESCAPED_UNICODE);
    }

    private function schemaTemplate(): array
    {
        return [
            'contractor' => [
                'first_name' => '',
                'middle_name' => '',
                'last_name' => '',
                'second_last_name' => '',
                'rfc' => '',
                'email' => '',
                'phone' => '',
            ],
            'insured' => [
                'first_name' => '',
                'middle_name' => '',
                'last_name' => '',
                'second_last_name' => '',
                'rfc' => '',
            ],
            'policy' => [
                'insurer_name' => '',
                'product_name' => '',
                'policy_number' => '',
                'valid_from' => '',
                'valid_to' => '',
                'currency' => 'MXN',
                'payment_frequency' => '',
                'premium_total' => null,
            ],
            'beneficiaries' => [
                [
                    'name' => '',
                    'percentage' => null,
                ],
            ],
            'notes' => '',
        ];
    }
}
