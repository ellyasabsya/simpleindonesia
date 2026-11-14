<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        // Angka event, tiket, dan transaksi diisi setelah tabelnya dibuat.
        return Inertia::render('admin/dashboard', [
            'pending' => [
                ['label' => 'Event menunggu review', 'value' => 0],
                ['label' => 'Pesanan tiket menunggu verifikasi', 'value' => 0],
                ['label' => 'Penarikan dana menunggu', 'value' => 0],
                ['label' => 'Lembaga menunggu verifikasi', 'value' => \App\Models\Institution::where('status', 'pending')->count()],
                ['label' => 'Komentar dilaporkan', 'value' => 0],
            ],
            'platform' => [
                ['label' => 'Total event', 'value' => '0', 'note' => 'Belum ada event'],
                ['label' => 'Event tayang', 'value' => '0', 'note' => '0 belum tayang'],
                ['label' => 'Pengguna terdaftar', 'value' => (string) User::where('role', 'user')->count(), 'note' => 'Akun dengan peran user'],
                ['label' => 'Pendapatan platform', 'value' => 'Rp0', 'note' => 'Lihat detail di menu Pendapatan'],
            ],
        ]);
    }
}
