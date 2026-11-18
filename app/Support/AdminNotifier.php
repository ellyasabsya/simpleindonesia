<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\AdminAlert;
use Illuminate\Support\Facades\Notification;

class AdminNotifier
{
    /** Kirim notifikasi lonceng ke semua admin. Gagal kirim tidak boleh mengganggu aksi pengguna. */
    public static function send(string $title, string $message, ?string $url = null): void
    {
        try {
            Notification::send(User::where('role', 'admin')->get(), new AdminAlert($title, $message, $url));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
