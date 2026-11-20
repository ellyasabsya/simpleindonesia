<?php

namespace App\Support;

use App\Models\Certificate;
use App\Models\CertificateBatch;
use App\Models\CertificateTemplate;
use App\Models\Event;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Penerbitan satu sertifikat. Idempotent: satu penerima (event + kategori + kunci penerima) hanya
 * punya satu baris, satu nomor, satu token, dan satu berkas PDF. Menjalankan ulang (retry job,
 * klik ganda, dua worker bersamaan) memakai baris yang sama dan tidak menggandakan apa pun.
 */
class CertificateIssuer
{
    public const DISK = 'local'; // storage/app/private, tidak pernah lewat public/storage

    public static function pdfPath(Certificate $c): string
    {
        return 'certificate-pdf/'.$c->event_id.'/'.$c->id.'.pdf';
    }

    /**
     * @param  array  $r  baris dari CertificateRecipients
     */
    public static function issue(Event $event, CertificateTemplate $template, array $r, ?int $batchId = null, ?int $actorId = null): Certificate
    {
        $cert = self::ensureRow($event, $template, $r, $batchId);

        if ($cert->status === Certificate::REVOKED) {
            return $cert; // sertifikat yang dicabut tidak diterbitkan ulang lewat jalur ini
        }
        if ($cert->status === Certificate::ISSUED && $cert->pdf_path && Storage::disk(self::DISK)->exists($cert->pdf_path)) {
            return $cert; // sudah selesai: tidak melakukan apa pun
        }

        $pdf = self::render($event, $template, $cert);

        return DB::transaction(function () use ($cert, $pdf, $actorId) {
            $locked = Certificate::whereKey($cert->id)->lockForUpdate()->firstOrFail();

            // Worker lain sudah menyelesaikannya: pakai hasilnya, jangan menimpa berkas.
            if ($locked->status === Certificate::ISSUED && $locked->pdf_path && Storage::disk(self::DISK)->exists($locked->pdf_path)) {
                return $locked;
            }
            if ($locked->status === Certificate::REVOKED) {
                return $locked;
            }

            $path = self::pdfPath($locked);
            Storage::disk(self::DISK)->put($path, $pdf);

            $first = $locked->status !== Certificate::ISSUED;
            $locked->forceFill([
                'pdf_path' => $path,
                'pdf_hash' => hash('sha256', $pdf),
                'status' => Certificate::ISSUED,
                'issued_at' => $locked->issued_at ?? now(),
            ])->save();

            if ($first) {
                $locked->record('issued', $actorId);
            }

            return $locked;
        });
    }

    /** Ambil baris yang sudah ada atau buat baru (dengan nomor dan token). Aman terhadap proses bersamaan. */
    public static function ensureRow(Event $event, CertificateTemplate $template, array $r, ?int $batchId = null): Certificate
    {
        $find = fn () => Certificate::where('event_id', $event->id)
            ->where('category', $r['category'])
            ->where('recipient_key', $r['key'])
            ->orderByDesc('revision')
            ->first();

        if ($existing = $find()) {
            if ($batchId && $existing->status !== Certificate::ISSUED && $existing->status !== Certificate::REVOKED) {
                $existing->forceFill(['batch_id' => $batchId, 'status' => Certificate::PENDING])->save();
            }

            return $existing;
        }

        $template->loadMissing('signer');
        $event->loadMissing('institution');
        $signer = $template->signer;
        $number = self::uniqueNumber($event, $template, (string) $r['category']);
        $values = CertificateDesign::values($event, $r['name'], '', $number, $signer?->name, $signer?->position);

        try {
            return Certificate::create([
                'event_id' => $event->id,
                'institution_id' => $event->institution_id,
                'batch_id' => $batchId,
                'template_id' => $template->id,
                'category' => $r['category'],
                'award_title' => $r['award_title'] ?? null,
                'recipient_key' => $r['key'],
                'revision' => 1,
                'user_id' => $r['user_id'] ?? null,
                'recipient_name' => $r['name'],
                'recipient_email' => $r['email'] ?? null,
                'event_title' => (string) $event->title,
                'organizer_name' => (string) ($event->institution->name ?? ''),
                'event_date_text' => $values['tanggal_event'],
                'design_snapshot' => [
                    'template_id' => $template->id,
                    'template_name' => $template->name,
                    'orientation' => $template->orientation,
                    'design' => CertificateDesign::normalize((array) $template->design),
                    'signer_name' => $signer?->name,
                    'signer_position' => $signer?->position,
                ],
                'certificate_number' => $number,
                'verify_token' => Certificate::newToken(),
                'status' => Certificate::PENDING,
            ]);
        } catch (QueryException $e) {
            // Dua proses membuat baris yang sama: yang kalah memakai baris pemenang.
            if ($row = $find()) {
                return $row;
            }
            throw $e;
        }
    }

    /**
     * Nomor dari format template. Kolom certificate_number unik di seluruh tabel, jadi bila format
     * yang sama sudah dipakai (kategori lain, event lain) ditambah penanda kategori lalu id event.
     */
    private static function uniqueNumber(Event $event, CertificateTemplate $template, string $category): string
    {
        $seq = Certificate::nextSequence($event->id, $category);
        $base = CertificateDesign::formatNumber($event, (string) $template->number_format, $seq);

        $candidates = [
            $base,
            $base.'/'.strtoupper(str_replace('_', '', $category)),
            $base.'/'.strtoupper(str_replace('_', '', $category)).'/E'.$event->id,
        ];
        foreach ($candidates as $n) {
            if (! Certificate::where('certificate_number', $n)->exists()) {
                return $n;
            }
        }

        return end($candidates).'/'.$seq;
    }

    /** Render dari snapshot (hasil sama pada retry) dengan gambar dari template. */
    public static function render(Event $event, CertificateTemplate $template, Certificate $cert): string
    {
        $snap = (array) $cert->design_snapshot;
        $template->loadMissing('signer');

        $values = CertificateDesign::values(
            $event, $cert->recipient_name, $cert->categoryLabel(), $cert->certificate_number,
            $snap['signer_name'] ?? null, $snap['signer_position'] ?? null
        );

        return CertificatePdf::render(
            (array) ($snap['design'] ?? $template->design),
            (string) ($snap['orientation'] ?? $template->orientation),
            $values,
            [
                'logo' => self::dataUri($template->logo_path),
                'signature' => self::dataUri($template->signer?->signature_path),
                'background' => self::dataUri($template->background_path),
            ]
        );
    }

    private static function dataUri(?string $path): ?string
    {
        if (! $path || ! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }
        $bin = Storage::disk(self::DISK)->get($path);
        $info = @getimagesizeFromString($bin);
        $mime = $info['mime'] ?? 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($bin);
    }

    /** Hitung ulang progres batch dari data sertifikat. Aman dipanggil berulang (tidak menggandakan hitungan). */
    public static function refreshBatch(?int $batchId): void
    {
        if (! $batchId) {
            return;
        }
        $batch = CertificateBatch::find($batchId);
        if (! $batch) {
            return;
        }

        $done = Certificate::where('batch_id', $batchId)->where('status', Certificate::ISSUED)->count();
        $failed = Certificate::where('batch_id', $batchId)->where('status', Certificate::FAILED)->count();

        $data = ['done' => $done, 'failed' => $failed];
        if ($batch->status === 'queued') {
            $data['status'] = 'running';
            $data['started_at'] = $batch->started_at ?? now();
        }
        if ($done + $failed >= $batch->total) {
            $data['status'] = $failed >= $batch->total && $batch->total > 0 ? 'failed' : 'done';
            $data['finished_at'] = $batch->finished_at ?? now();
        }
        $batch->forceFill($data)->save();
    }
}
