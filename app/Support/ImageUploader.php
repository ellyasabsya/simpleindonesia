<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageUploader
{
    public const MAX_BYTES = 2 * 1024 * 1024;

    /** Simpan unggahan. Gambar diperkecil dan dikompres di bawah 2 MB, PDF dibatasi 2 MB. */
    public static function store(UploadedFile $file, string $dir, string $field, int $maxSide = 1600, string $disk = 'public'): string
    {
        $mime = (string) $file->getMimeType();

        if ($mime === 'application/pdf') {
            if ($file->getSize() > self::MAX_BYTES) {
                throw ValidationException::withMessages([$field => 'Ukuran PDF maksimal 2 MB.']);
            }

            return $file->store($dir, $disk);
        }

        $info = @getimagesize($file->getRealPath());
        if (! $info || $info[0] * $info[1] > 40000000) {
            throw ValidationException::withMessages([$field => 'Dimensi gambar terlalu besar atau tidak valid.']);
        }

        @ini_set('memory_limit', '512M');

        $img = @imagecreatefromstring((string) file_get_contents($file->getRealPath()));
        if (! $img) {
            throw ValidationException::withMessages([$field => 'Gambar tidak bisa dibaca. Coba foto lain.']);
        }

        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($file->getRealPath());
            $angle = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
            if ($angle) {
                $rot = imagerotate($img, $angle, 0);
                if ($rot) {
                    $img = $rot;
                }
            }
        }

        imagepalettetotruecolor($img);
        imagealphablending($img, true);
        imagesavealpha($img, true);

        $w = imagesx($img);
        $h = imagesy($img);
        $scale = min(1, $maxSide / max($w, $h));
        if ($scale < 1) {
            $img = imagescale($img, (int) round($w * $scale), -1);
        }

        $webp = function_exists('imagewebp');
        if (! $webp) {
            // JPEG tidak mendukung transparansi: letakkan di atas latar putih.
            $flat = imagecreatetruecolor(imagesx($img), imagesy($img));
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $img, 0, 0, 0, 0, imagesx($img), imagesy($img));
            $img = $flat;
        }

        $bytes = '';
        for ($attempt = 0; $attempt < 4; $attempt++) {
            foreach ([82, 72, 62, 50, 40] as $q) {
                $bytes = self::encode($img, $webp, $q);
                if (strlen($bytes) <= self::MAX_BYTES) {
                    break 2;
                }
            }
            $img = imagescale($img, (int) round(imagesx($img) * 0.8), -1);
        }

        if (strlen($bytes) > self::MAX_BYTES) {
            throw ValidationException::withMessages([$field => 'Gambar terlalu besar dan tidak bisa dikompres. Coba foto lain.']);
        }

        $path = trim($dir, '/').'/'.Str::random(40).($webp ? '.webp' : '.jpg');
        Storage::disk($disk)->put($path, $bytes);

        return $path;
    }

    private static function encode(\GdImage $img, bool $webp, int $quality): string
    {
        ob_start();
        $webp ? imagewebp($img, null, $quality) : imagejpeg($img, null, $quality);

        return (string) ob_get_clean();
    }
}
