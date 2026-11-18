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
                ['label' => 'Event menunggu review', 'value' => \App\Models\Event::whereNull('parent_id')->where('status', 'pending')->count()],
                ['label' => 'Pesanan tiket menunggu verifikasi', 'value' => \Illuminate\Support\Facades\DB::table('ticket_orders')->where('status', 'menunggu_verifikasi')->count()],
                ['label' => 'Penarikan dana menunggu', 'value' => \App\Models\Withdrawal::where('status', 'menunggu')->count()],
                ['label' => 'Lembaga menunggu verifikasi', 'value' => \App\Models\Institution::where('status', 'pending')->count()],
                ['label' => 'Komentar dilaporkan', 'value' => \App\Models\EventComment::whereNotNull('reported_at')->count()],
            ],
            'platform' => [
                ['label' => 'Total event', 'value' => (string) \App\Models\Event::count(), 'note' => 'Semua lembaga'],
                ['label' => 'Event tayang', 'value' => (string) \App\Models\Event::where('status', 'published')->count(), 'note' => 'Sudah dipublikasikan'],
                ['label' => 'Pengguna terdaftar', 'value' => (string) User::where('role', 'user')->count(), 'note' => 'Akun dengan peran user'],
                ['label' => 'Pendapatan platform', 'value' => 'Rp'.number_format(\App\Support\Revenue::report()['summary']['platform'], 0, ',', '.'), 'note' => 'Lihat detail di menu Pendapatan'],
            ],
        ]);
    }
}
