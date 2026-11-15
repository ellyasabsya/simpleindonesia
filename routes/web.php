<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');


Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

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
                'penilaian' => 'Sistem Penilaian',
                'tiket' => 'Verifikasi Tiket',
                'verifikasi-paket' => 'Verifikasi Paket',
                'pendapatan' => 'Pendapatan',
                'transaksi' => 'Transaksi',
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
        Route::get('paket', [\App\Http\Controllers\Admin\PackageController::class, 'index'])->name('paket.index');
        Route::post('paket', [\App\Http\Controllers\Admin\PackageController::class, 'store'])->name('paket.store');
        Route::patch('paket/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'update'])->name('paket.update');
        Route::delete('paket/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'destroy'])->name('paket.destroy');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserHasApprovedInstitution::class])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::get('event', [\App\Http\Controllers\Panel\EventController::class, 'index'])->name('event');
        Route::get('ajukan', [\App\Http\Controllers\Panel\EventController::class, 'create'])->name('ajukan');
        Route::post('ajukan', [\App\Http\Controllers\Panel\EventController::class, 'store'])->name('ajukan.store');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserIsAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('events', [\App\Http\Controllers\Admin\EventController::class, 'index'])->name('events');
        Route::get('review', [\App\Http\Controllers\Admin\EventController::class, 'review'])->name('review');
        Route::patch('events/{event}/approve', [\App\Http\Controllers\Admin\EventController::class, 'approve'])->name('events.approve');
        Route::patch('events/{event}/reject', [\App\Http\Controllers\Admin\EventController::class, 'reject'])->name('events.reject');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserHasApprovedInstitution::class])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Panel\PanelController::class, 'dashboard'])->name('dashboard');

        $pages = [
            'peserta' => 'Peserta',
            'tiket' => 'Tiket & Penjualan',
            'voting' => 'Voting',
            'penilaian' => 'Penilaian',
            'pendapatan' => 'Pendapatan',
        ];
        foreach ($pages as $slug => $title) {
            Route::get($slug, fn (\Illuminate\Http\Request $r) => app(\App\Http\Controllers\Panel\PanelController::class)->placeholder($r, $title))
                ->name($slug);
        }
    });

Route::middleware([
    'auth',
    \App\Http\Middleware\EnsureUserHasApprovedInstitution::class,
    \App\Http\Middleware\EnsureEventMenuAccess::class,
])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::get('event/{event}', [\App\Http\Controllers\Panel\EventDashboardController::class, 'show'])->name('event.show');
        Route::get('event/{event}/{menu}', [\App\Http\Controllers\Panel\EventDashboardController::class, 'menu'])->name('event.menu');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserHasApprovedInstitution::class])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::get('profil', [\App\Http\Controllers\Panel\ProfileController::class, 'show'])->name('profil');
        Route::post('profil', [\App\Http\Controllers\Panel\ProfileController::class, 'update'])->name('profil.update');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserHasApprovedInstitution::class])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::post('anggota', [\App\Http\Controllers\Panel\MemberController::class, 'store'])->name('anggota.store');
        Route::delete('anggota/{member}', [\App\Http\Controllers\Panel\MemberController::class, 'destroy'])->name('anggota.destroy');
    });
