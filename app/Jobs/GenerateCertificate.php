<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Event;
use App\Support\CertificateIssuer;
use App\Support\CertificateNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Menerbitkan satu sertifikat untuk satu penerima. Idempotent (lihat CertificateIssuer):
 * retry atau dua kali dijalankan tidak menggandakan baris, nomor, token, maupun berkas PDF.
 */
class GenerateCertificate implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /** @var array<int,int> */
    public array $backoff = [10, 60];

    public function __construct(
        public int $eventId,
        public int $templateId,
        public array $recipient,
        public ?int $batchId = null,
        public ?int $actorId = null,
    ) {
    }

    public function handle(): void
    {
        $event = Event::find($this->eventId);
        $template = CertificateTemplate::with('signer')->find($this->templateId);

        if (! $event || ! $template) {
            $this->fail(new \RuntimeException('Event atau template tidak ditemukan.'));

            return;
        }

        $cert = CertificateIssuer::issue($event, $template, $this->recipient, $this->batchId, $this->actorId);
        CertificateIssuer::refreshBatch($this->batchId);

        // Setelah PDF dan data tersimpan. Aman diulang: notified_at mencegah notifikasi ganda.
        CertificateNotifier::send($cert);
    }

    /** Dipanggil sekali setelah semua percobaan habis. */
    public function failed(Throwable $e): void
    {
        try {
            $event = Event::find($this->eventId);
            $template = CertificateTemplate::with('signer')->find($this->templateId);

            if ($event && $template) {
                $cert = CertificateIssuer::ensureRow($event, $template, $this->recipient, $this->batchId);
                if ($cert->status !== Certificate::ISSUED && $cert->status !== Certificate::REVOKED) {
                    $cert->forceFill(['status' => Certificate::FAILED])->save();
                    $cert->record('failed', $this->actorId, ['error' => mb_substr($e->getMessage(), 0, 300)]);
                }
            }
            CertificateIssuer::refreshBatch($this->batchId);
        } catch (Throwable $inner) {
            report($inner);
        }
    }
}
