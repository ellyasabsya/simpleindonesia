<?php

namespace App\Notifications;

use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgendaReminder extends Notification
{
    public function __construct(
        public string $eventTitle,
        public string $agendaTitle,
        public string $when,
        public ?string $location,
        public string $url,
    ) {}

    public function via($notifiable): array
    {
        if ($notifiable instanceof AnonymousNotifiable) {
            return ['mail'];
        }

        return filled($notifiable->email ?? null) ? ['database', 'mail'] : ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'text' => "Pengingat: {$this->agendaTitle} ({$this->eventTitle}) {$this->when}",
            'url' => $this->url,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $m = (new MailMessage)
            ->subject("Pengingat: {$this->agendaTitle} - {$this->eventTitle}")
            ->greeting('Halo!')
            ->line("Kegiatan \"{$this->agendaTitle}\" pada event {$this->eventTitle} akan segera dimulai.")
            ->line("Waktu: {$this->when}");
        if ($this->location) {
            $m->line("Lokasi: {$this->location}");
        }

        return $m->action('Lihat event', url($this->url));
    }
}
