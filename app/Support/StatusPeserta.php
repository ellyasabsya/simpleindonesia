<?php

namespace App\Support;

class StatusPeserta
{
    private const LABEL = [
        'menunggu' => 'Menunggu',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
        'batal' => 'Dibatalkan',
    ];

    public static function transfer(?string $status): array
    {
        return self::bentuk(match (strtolower((string) $status)) {
            'terdaftar' => 'disetujui',
            'ditolak' => 'ditolak',
            'dibatalkan', 'batal', 'kedaluwarsa' => 'batal',
            default => 'menunggu',
        });
    }

    public static function tiket(?string $status, $rejectedAt = null, $expiresAt = null): array
    {
        return self::bentuk(match (strtolower((string) $status)) {
            'lunas' => 'disetujui',
            'batal' => $rejectedAt ? 'ditolak' : 'batal',
            'menunggu' => ($expiresAt && \Illuminate\Support\Carbon::parse($expiresAt)->isPast()) ? 'batal' : 'menunggu',
            default => 'menunggu',
        });
    }

    private static function bentuk(string $kode): array
    {
        return ['status_code' => $kode, 'status_label' => self::LABEL[$kode]];
    }
}
