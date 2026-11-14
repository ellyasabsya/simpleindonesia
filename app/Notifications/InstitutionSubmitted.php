<?php

namespace App\Notifications;

use App\Models\Institution;
use Illuminate\Notifications\Notification;

class InstitutionSubmitted extends Notification
{
    public function __construct(public Institution $institution) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'institution_id' => $this->institution->id,
            'title' => 'Pengajuan lembaga baru',
            'message' => "{$this->institution->name} mengajukan verifikasi lembaga.",
            'url' => '/admin/lembaga?status=pending',
        ];
    }
}
