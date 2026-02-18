<?php

namespace App\Support\Filesystem;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

final class MediaDisk
{
    public static function name(): string
    {
        $default = config('filesystems.default', 'public');
        if (! $default || $default === 'local') {
            return 'public';
        }
        return $default;
    }

    public static function disk(): FilesystemAdapter
    {
        return Storage::disk(self::name());
    }

    public static function exists(?string $path): bool
    {
        $normalized = self::normalize($path);

        if (! $normalized) {
            return false;
        }

        return self::disk()->exists($normalized);
    }

    public static function delete(?string $path): void
    {
        $normalized = self::normalize($path);

        if (! $normalized) {
            return;
        }

        self::disk()->delete($normalized);
    }

    public static function url_amazon(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        if (Str::startsWith($path, '/')) {
            return url($path);
        }

        $normalized = self::normalize($path);

        if (! $normalized) {
            return null;
        }

        $extension = strtolower(pathinfo($normalized, PATHINFO_EXTENSION));
        $validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        if (! in_array($extension, $validImageExtensions)) {
            return asset('assets/icons/img.svg');
        }

        return self::temporaryUrl($normalized);
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        if (Str::startsWith($path, '/')) {
            return url($path);
        }

        $normalized = self::normalize($path);

        if (! $normalized) {
            return null;
        }

        $extension = strtolower(pathinfo($normalized, PATHINFO_EXTENSION));
        $validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        if (! in_array($extension, $validImageExtensions)) {
            return asset('assets/icons/img.svg');
        }

        try {
            return route('media.show', ['path' => $normalized]);
        } catch (RouteNotFoundException $exception) {
            return self::temporaryUrl($normalized);
        }
    }

    public static function readStream(?string $path)
    {
        $normalized = self::normalize($path);

        if (! $normalized || ! self::disk()->exists($normalized)) {
            return null;
        }

        return self::disk()->readStream($normalized);
    }

    protected static function normalize(?string $path): ?string
    {
        if (! $path || Str::startsWith($path, ['http://', 'https://'])) {
            return null;
        }

        $trimmed = ltrim($path, '/');
        $trimmed = Str::replaceFirst('storage/', '', $trimmed);

        return $trimmed !== '' ? $trimmed : null;
    }

    public static function temporaryUrl(?string $path, ?\DateTimeInterface $expiration = null): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $normalized = self::normalize($path) ?? $path;

        $disk = self::disk();
        $expiresAt = $expiration ? Carbon::parse($expiration) : now()->addHour();

        if (method_exists($disk, 'temporaryUrl')) {
            try {
                return $disk->temporaryUrl($normalized, $expiresAt);
            } catch (\Throwable $exception) {
                // Fallback below
            }
        }

        try {
            return $disk->url($normalized);
        } catch (\Throwable $exception) {
            $fallback = Storage::url($normalized);

            if (Str::startsWith($fallback, ['http://', 'https://'])) {
                return $fallback;
            }

            return url($fallback);
        }
    }
}
