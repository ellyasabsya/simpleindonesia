<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return auth()->user()->isAdmin()
            ? redirect('/admin')
            : \Inertia\Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/admin', fn () => \Inertia\Inertia::render('admin/dashboard'))
        ->middleware(\App\Http\Middleware\EnsureUserIsAdmin::class)
        ->name('admin.dashboard');
});
