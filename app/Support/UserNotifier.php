<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\AdminAlert;

class UserNotifier
{
    /** Kirim notifikasi lonceng ke satu user. Gagal kirim tidak boleh mengganggu aksi admin. */
    public static function send(?User $user, string $title, string $message, ?string $url = null): void
    {
        if (! $user) {
            return;
        }

        try {
            $user->notify(new AdminAlert($title, $message, $url));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
