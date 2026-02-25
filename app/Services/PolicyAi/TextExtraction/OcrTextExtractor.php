<?php

namespace App\Services\PolicyAi\TextExtraction;

use RuntimeException;
use Illuminate\Support\Facades\Process;

class OcrTextExtractor implements TextExtractor
{
    public function extract(string $absolutePath, string $mimeType): ?string
    {
        if (! Process::run('command -v tesseract')->successful()) {
            throw new RuntimeException('OCR no configurado');
        }

        if ($mimeType === 'application/pdf') {
            if (! Process::run('command -v pdftoppm')->successful()) {
                throw new RuntimeException('OCR no configurado');
            }

            $base = storage_path('app/tmp/policy-ai-'.uniqid());
            @mkdir($base, 0777, true);
            $prefix = $base.'/page';
            Process::run(sprintf('pdftoppm -jpeg %s %s', escapeshellarg($absolutePath), escapeshellarg($prefix)));

            $images = glob($prefix.'-*.jpg') ?: [];
            $chunks = [];

            foreach ($images as $imagePath) {
                $ocr = Process::run(sprintf('tesseract %s stdout -l spa+eng', escapeshellarg($imagePath)));
                if ($ocr->successful()) {
                    $chunks[] = trim($ocr->output());
                }
            }

            collect($images)->each(fn ($file) => @unlink($file));
            @rmdir($base);

            $text = trim(implode("\n\n", array_filter($chunks)));

            return $text !== '' ? $text : null;
        }

        if (! str_starts_with($mimeType, 'image/')) {
            return null;
        }

        $ocr = Process::run(sprintf('tesseract %s stdout -l spa+eng', escapeshellarg($absolutePath)));

        if (! $ocr->successful()) {
            return null;
        }

        $text = trim($ocr->output());

        return $text !== '' ? $text : null;
    }
}
