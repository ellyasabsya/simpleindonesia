<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');


Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return auth()->user()->isAdmin()
            ? redirect('/admin')
            : \Inertia\Inertia::render('dashboard');
    })->name('dashboard');

    Route::middleware(\App\Http\Middleware\EnsureUserIsAdmin::class)
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {
            Route::get('/', \App\Http\Controllers\Admin\DashboardController::class)->name('dashboard');

            // Halaman yang belum dibuat: tampil "Segera hadir"
            $pages = [
                'events' => 'Manajemen Event',
                'review' => 'Review Event',
                'penilaian' => 'Sistem Penilaian',
                'tiket' => 'Verifikasi Tiket',
                'verifikasi-paket' => 'Verifikasi Paket',
                'pendapatan' => 'Pendapatan',
                'transaksi' => 'Transaksi',
                'lembaga' => 'Lembaga',
                'paket' => 'Manajemen Paket',
            ];
            foreach ($pages as $slug => $title) {
                Route::get($slug, fn () => \Inertia\Inertia::render('admin/placeholder', ['title' => $title]))
                    ->name($slug);
            }
        });
});

Route::middleware('auth')->group(function () {
    Route::get('/lembaga/daftar', [\App\Http\Controllers\LembagaController::class, 'create'])->name('lembaga.daftar');
    Route::post('/lembaga', [\App\Http\Controllers\LembagaController::class, 'store'])->name('lembaga.store');
});
