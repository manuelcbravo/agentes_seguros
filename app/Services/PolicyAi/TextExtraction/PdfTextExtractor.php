<?php

namespace App\Services\PolicyAi\TextExtraction;

use Illuminate\Support\Facades\Process;

class PdfTextExtractor implements TextExtractor
{
    public function extract(string $absolutePath, string $mimeType): ?string
    {
        if ($mimeType !== 'application/pdf') {
            return null;
        }

        if (! Process::run('command -v pdftotext')->successful()) {
            return null;
        }

        $result = Process::run(sprintf('pdftotext -layout %s -', escapeshellarg($absolutePath)));

        if (! $result->successful()) {
            return null;
        }

        $text = trim($result->output());

        return $text !== '' ? $text : null;
    }
}
