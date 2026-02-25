<?php

namespace App\Services\PolicyAi\TextExtraction;

interface TextExtractor
{
    public function extract(string $absolutePath, string $mimeType): ?string;
}
