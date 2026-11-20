<?php

namespace App\Notifications;

use App\Models\Certificate;
use Illuminate\Notifications\Notification;

/** Pemberitahuan di lonceng: sertifikat sudah terbit. Tautan menuju detail sertifikat milik akun penerima. */
class CertificateIssued extends Notification
{
    public function __construct(public Certificate $certificate)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $c = $this->certificate;

        return [
            'type' => 'certificate_issued',
            'certificate_id' => $c->id,
            'text' => 'Sertifikat '.$c->categoryLabel().' untuk "'.$c->event_title.'" sudah terbit.',
            'url' => route('sertifikat.saya.detail', ['certificate' => $c->id], false),
        ];
    }
}
