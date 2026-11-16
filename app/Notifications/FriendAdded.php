<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;

class FriendAdded extends Notification
{
    public function __construct(public User $by) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'text' => "{$this->by->name} menambahkan Anda sebagai teman",
            'url' => '/u/' . $this->by->username,
        ];
    }
}
