<?php

namespace App\Services\PolicyAI;

use App\Services\OpenAI\OpenAiClient;
use JsonException;
use RuntimeException;

class PolicyAiExtractorService
{
    public function __construct(private readonly OpenAiClient $openAiClient) {}

    public function extract(string $text): array
    {
        $template = $this->schemaTemplate();

        $messages = [
            [
                'role' => 'system',
                'content' => implode("\n", [
                    'Eres un extractor de datos de pólizas de seguros en México.',
                    'Responde SOLO JSON válido.',
                    'No agregues texto extra fuera del JSON.',
                    'Si no sabes un dato, usa null o string vacío según corresponda.',
                    'Las fechas deben ir en formato YYYY-MM-DD.',
                    'policy_number puede ser alfanumérico o hexadecimal.',
                    'La estructura debe respetar exactamente el esquema solicitado.',
                ]),
            ],
            [
                'role' => 'user',
                'content' => "Extrae los datos con este JSON exacto: "
                    .json_encode($template, JSON_UNESCAPED_UNICODE)
                    ."\n\nTexto de póliza:\n"
                    .$this->trimInput($text),
            ],
        ];

        $response = $this->openAiClient->chatJson($messages);

        return $this->normalizeData($this->decodeJson((string) ($response['content'] ?? '')));
    }

    private function decodeJson(string $content): array
    {
        $start = strpos($content, '{');
        $end = strrpos($content, '}');

        if ($start === false || $end === false || $end < $start) {
            throw new RuntimeException('La IA no devolvió JSON válido');
        }

        $json = substr($content, $start, ($end - $start) + 1);

        try {
            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('La IA no devolvió JSON válido', previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('La IA no devolvió JSON válido');
        }

        return $decoded;
    }

    private function trimInput(string $text): string
    {
        return mb_substr(trim($text), 0, 16000);
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
            ->map(function ($beneficiary): array {
                return [
                    'name' => (string) data_get($beneficiary, 'name', ''),
                    'percentage' => is_numeric(data_get($beneficiary, 'percentage'))
                        ? (float) data_get($beneficiary, 'percentage')
                        : null,
                ];
            })
            ->values()
            ->all();
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
                ['name' => '', 'percentage' => null],
            ],
            'notes' => '',
        ];
    }
}
