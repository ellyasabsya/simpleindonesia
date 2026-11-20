<?php

namespace App\Support;

/** Kategori penerima sertifikat dan asal datanya. */
class CertificateCategories
{
    public const LABELS = [
        'peserta' => 'Peserta',
        'pemateri' => 'Pemateri / Narasumber',
        'moderator' => 'Moderator',
        'panitia' => 'Panitia',
        'juri' => 'Juri',
        'juara_1' => 'Juara 1',
        'juara_2' => 'Juara 2',
        'juara_3' => 'Juara 3',
        'khusus' => 'Penghargaan Khusus',
    ];

    /** Kategori yang daftarnya diambil otomatis dari data SIMPLE (tiket, pendaftaran, juri, penilaian). */
    public const AUTOMATIC = ['peserta', 'juri', 'juara_1', 'juara_2', 'juara_3'];

    /** Kategori yang diisi manual oleh penyelenggara (certificate_recipients). */
    public const MANUAL = ['pemateri', 'moderator', 'panitia', 'khusus'];

    public static function keys(): array
    {
        return array_keys(self::LABELS);
    }

    public static function valid(string $key): bool
    {
        return isset(self::LABELS[$key]);
    }

    public static function label(string $key): string
    {
        return self::LABELS[$key] ?? $key;
    }
}
