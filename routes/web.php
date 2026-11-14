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

            Route::get('lembaga', [\App\Http\Controllers\Admin\InstitutionController::class, 'index'])->name('lembaga');
            Route::patch('lembaga/{institution}/approve', [\App\Http\Controllers\Admin\InstitutionController::class, 'approve'])->name('lembaga.approve');
            Route::patch('lembaga/{institution}/revoke', [\App\Http\Controllers\Admin\InstitutionController::class, 'revoke'])->name('lembaga.revoke');

            Route::post('notifications/read-all', [\App\Http\Controllers\Admin\NotificationController::class, 'readAll'])->name('notifications.read-all');
            Route::post('notifications/{id}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'read'])->name('notifications.read');

            // Halaman yang belum dibuat: tampil "Segera hadir"
            $pages = [
                'events' => 'Manajemen Event',
                'review' => 'Review Event',
                'penilaian' => 'Sistem Penilaian',
                'tiket' => 'Verifikasi Tiket',
                'verifikasi-paket' => 'Verifikasi Paket',
                'pendapatan' => 'Pendapatan',
                'transaksi' => 'Transaksi',
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

Route::middleware(['auth', \App\Http\Middleware\EnsureUserIsAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('lembaga', [\App\Http\Controllers\Admin\InstitutionController::class, 'index'])->name('lembaga');
        Route::patch('lembaga/{institution}', [\App\Http\Controllers\Admin\InstitutionController::class, 'update'])->name('lembaga.update');
    });
