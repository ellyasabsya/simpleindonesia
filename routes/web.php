<?php

use Illuminate\Support\Facades\Route;

Route::get('/', \App\Http\Controllers\HomeController::class)->name('home');
Route::get('/paket', \App\Http\Controllers\PaketController::class)->name('paket.semua');
Route::get('/events', \App\Http\Controllers\EventController::class)->name('events.semua');
// Tiket hanya untuk pengguna yang sudah login.
Route::middleware('auth')->group(function () {
Route::get('/events/{event}/tiket', function (\App\Models\Event $event) {
    // patch-248: rangkaian dengan tiket kegiatan yang sedang dijual -> jendela beli gabungan
    if ($event->children()->where('status', \App\Models\Event::PUBLISHED)->where('registration_method', 'ticket')->where('ticket_sales_open', true)->whereHas('ticketTypes')->exists()) {
        return redirect('/tickets?beli='.$event->id);
    }
    if ($event->status !== \App\Models\Event::PUBLISHED) {
        abort(404);
    }
    if (in_array($event->registration_method, ['ticket', 'transfer_manual'], true) && $event->ticket_sales_open) {
        return redirect('/tickets?beli='.$event->id);
    }
    return redirect('/events/'.$event->slug);
})->whereNumber('event');

Route::get('/events/{event}/beli-data', [\App\Http\Controllers\TicketPurchaseController::class, 'data'])->whereNumber('event');
Route::get('/events/{event}/beli', [\App\Http\Controllers\TicketPurchaseController::class, 'show'])->whereNumber('event')->name('tiket.beli');
Route::post('/events/{event}/beli', [\App\Http\Controllers\TicketPurchaseController::class, 'store'])->whereNumber('event')->middleware('throttle:10,1');

// patch-248: pembelian gabungan satu rangkaian
Route::get('/events/{event}/beli-rangkaian-data', [\App\Http\Controllers\TicketSeriesController::class, 'data'])->whereNumber('event');
Route::post('/events/{event}/beli-rangkaian', [\App\Http\Controllers\TicketSeriesController::class, 'store'])->whereNumber('event')->middleware('throttle:10,1');
});
Route::get('/events/{event}/daftar', [\App\Http\Controllers\EventRegistrationFormController::class, 'show'])->whereNumber('event')->middleware('auth')->name('daftar.show');
Route::post('/events/{event}/daftar', [\App\Http\Controllers\EventRegistrationFormController::class, 'store'])->whereNumber('event')->middleware(['auth', 'throttle:10,1'])->name('daftar.store');
Route::post('events/{event}/daftar/lengkapi', [\App\Http\Controllers\EventRegistrationFormController::class, 'complete'])->whereNumber('event')->middleware(['auth', 'throttle:10,1'])->name('daftar.complete');
Route::get('/events/{key}', \App\Http\Controllers\EventDetailController::class)->name('events.show');
Route::middleware(['auth', 'throttle:10,1'])->post('/events/{event}/komentar', [\App\Http\Controllers\EventCommentController::class, 'store'])->name('events.komentar.store');
Route::middleware('auth')->delete('/komentar/{comment}', [\App\Http\Controllers\EventCommentController::class, 'destroy'])->name('events.komentar.destroy');
Route::middleware(['auth', 'throttle:10,1'])->post('/komentar/{comment}/lapor', [\App\Http\Controllers\EventCommentController::class, 'report'])->name('events.komentar.report');
Route::get('/edit-event/{token}', [\App\Http\Controllers\EventEditLinkController::class, 'show'])->middleware('throttle:30,1')->name('edit-link.show');
Route::get('/events/{event}/masuk', function (\Illuminate\Http\Request $request, \App\Models\Event $event) {
    // Ganti ke '/events/'.$event->id.'/daftar' setelah form pendaftaran dibuat.
    $to = $event->registration_method === 'ticket'
        ? url('/events/'.($event->slug ?: $event->id))
        : url('/events/'.$event->id.'/daftar');
    if ($request->user()) {
        return redirect($to);
    }
    session(['url.intended' => $to]);

    return redirect()->route('login');
})->whereNumber('event')->name('events.masuk');
Route::post('/edit-event/{token}', [\App\Http\Controllers\EventEditLinkController::class, 'update'])->middleware('throttle:10,1')->name('edit-link.update');


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
                
                'tiket' => 'Verifikasi Tiket',
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
        Route::get('penilaian', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'index'])->name('penilaian');
        Route::patch('penilaian/{system}/cantolan/{hook}', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'toggleHook'])->where(['system' => '[a-z_0-9]+', 'hook' => '[a-z_]+'])->name('penilaian.hook');
        Route::post('penilaian', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'store'])->name('penilaian.store');
        Route::patch('penilaian/{system}', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'update'])->where('system', '[a-z_0-9]+')->name('penilaian.update');
        Route::patch('penilaian/{system}/aktif', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'toggle'])->where('system', '[a-z_0-9]+')->name('penilaian.toggle');
        
        Route::post('paket', [\App\Http\Controllers\Admin\PackageController::class, 'store'])->name('paket.store');
        Route::patch('paket/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'update'])->name('paket.update');
        Route::delete('paket/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'destroy'])->name('paket.destroy');
        Route::get('verifikasi-paket', [\App\Http\Controllers\Admin\PackagePaymentController::class, 'index'])->name('verifikasi-paket');
        Route::get('verifikasi-paket/{event}/bukti', [\App\Http\Controllers\Admin\PackagePaymentController::class, 'proof'])->name('verifikasi-paket.bukti');
        Route::patch('verifikasi-paket/{event}/setujui', [\App\Http\Controllers\Admin\PackagePaymentController::class, 'approve'])->name('verifikasi-paket.setujui');
        Route::patch('verifikasi-paket/{event}/tolak', [\App\Http\Controllers\Admin\PackagePaymentController::class, 'reject'])->name('verifikasi-paket.tolak');
        Route::get('pendapatan', [\App\Http\Controllers\Admin\RevenueController::class, 'index'])->name('pendapatan');
        Route::get('pendapatan/csv', [\App\Http\Controllers\Admin\RevenueController::class, 'csv'])->name('pendapatan.csv');
        Route::get('pendapatan/cetak', [\App\Http\Controllers\Admin\RevenueController::class, 'print'])->name('pendapatan.cetak');
        Route::patch('penarikan/{withdrawal}/setujui', [\App\Http\Controllers\Admin\RevenueController::class, 'approve'])->name('penarikan.setujui');
        Route::patch('penarikan/{withdrawal}/tolak', [\App\Http\Controllers\Admin\RevenueController::class, 'reject'])->name('penarikan.tolak');
        Route::post('penarikan/{withdrawal}/transfer', [\App\Http\Controllers\Admin\RevenueController::class, 'transfer'])->name('penarikan.transfer');
        Route::get('penarikan/{withdrawal}/bukti', [\App\Http\Controllers\Admin\RevenueController::class, 'proof'])->name('penarikan.bukti');
        Route::get('transaksi', [\App\Http\Controllers\Admin\TransactionController::class, 'index'])->name('transaksi');
        Route::get('transaksi/csv', [\App\Http\Controllers\Admin\TransactionController::class, 'csv'])->name('transaksi.csv');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserHasApprovedInstitution::class])
    ->prefix('panel')
    ->name('panel.')
    ->group(function () {
        Route::redirect('event', '/panel')->name('event');
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
        Route::patch('events/{event}', [\App\Http\Controllers\Admin\EventController::class, 'update'])->name('events.update');
        Route::delete('events/{event}', [\App\Http\Controllers\Admin\EventController::class, 'destroy'])->name('events.destroy');
        Route::get('events/{event}/edit', [\App\Http\Controllers\Admin\EventController::class, 'edit'])->name('events.edit');
        Route::post('events/{event}/detail', [\App\Http\Controllers\Admin\EventController::class, 'updateFull'])->name('events.detail');
        Route::post('events/{event}/edit-links', [\App\Http\Controllers\Admin\EditLinkController::class, 'store'])->name('events.edit-links.store');
        Route::patch('events/{event}/edit-links/{link}/revoke', [\App\Http\Controllers\Admin\EditLinkController::class, 'revoke'])->whereNumber('link')->name('events.edit-links.revoke');
        Route::get('pesanan-tiket', [\App\Http\Controllers\Admin\TicketOrderController::class, 'index'])->name('pesanan-tiket');
        Route::get('pesanan-tiket/{order}/bukti', [\App\Http\Controllers\Admin\TicketOrderController::class, 'proof'])->whereNumber('order');
        Route::patch('pesanan-tiket/{order}/setujui', [\App\Http\Controllers\Admin\TicketOrderController::class, 'approve'])->whereNumber('order');
        Route::patch('pesanan-tiket/{order}/tolak', [\App\Http\Controllers\Admin\TicketOrderController::class, 'reject'])->whereNumber('order');
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
        ];

        Route::get('pendapatan', [\App\Http\Controllers\Panel\WithdrawalController::class, 'index'])->name('pendapatan');
        Route::post('penarikan', [\App\Http\Controllers\Panel\WithdrawalController::class, 'store'])->name('penarikan.store');
        Route::post('pin/kode', [\App\Http\Controllers\Panel\WithdrawalController::class, 'sendCode'])->middleware('throttle:3,1')->name('pin.kode');
        Route::post('pin', [\App\Http\Controllers\Panel\WithdrawalController::class, 'savePin'])->middleware('throttle:6,1')->name('pin.simpan');
        Route::put('rekening', [\App\Http\Controllers\Panel\WithdrawalController::class, 'saveAccount'])->middleware('throttle:10,1')->name('rekening.simpan');
        Route::get('penarikan/{withdrawal}/bukti', [\App\Http\Controllers\Panel\WithdrawalController::class, 'proof'])->whereNumber('withdrawal')->name('penarikan.bukti');

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
        Route::get('event/{event}/voting', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'index'])->whereNumber('event')->name('event.voting.index');
        Route::post('event/{event}/voting/aktif', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'toggle'])->whereNumber('event')->name('event.voting.toggle');
        Route::put('event/{event}/voting/pengaturan', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'settingsUpdate'])->whereNumber('event')->name('event.voting.settingsUpdate');
        Route::post('event/{event}/voting/kategori', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'storeCategory'])->whereNumber('event')->name('event.voting.storeCategory');
        Route::delete('event/{event}/voting/kategori/{item}', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'destroyCategory'])->whereNumber(['event', 'item'])->name('event.voting.destroyCategory');
        Route::post('event/{event}/voting/peserta', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'storeParticipant'])->whereNumber('event')->name('event.voting.storeParticipant');
        Route::put('event/{event}/voting/peserta/{item}', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'updateParticipant'])->whereNumber(['event', 'item'])->name('event.voting.updateParticipant');
        Route::delete('event/{event}/voting/peserta/{item}', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'destroyParticipant'])->whereNumber(['event', 'item'])->name('event.voting.destroyParticipant');
        Route::post('event/{event}/voting/gift', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'storeGift'])->whereNumber('event')->name('event.voting.storeGift');
        Route::put('event/{event}/voting/gift/{item}', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'updateGift'])->whereNumber(['event', 'item'])->name('event.voting.updateGift');
        Route::post('event/{event}/voting/gift/{item}/toggle', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'toggleGift'])->whereNumber(['event', 'item'])->name('event.voting.toggleGift');
        Route::delete('event/{event}/voting/gift/{item}', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'destroyGift'])->whereNumber(['event', 'item'])->name('event.voting.destroyGift');
        Route::post('event/{event}/voting/peserta/{item}/link', [\App\Http\Controllers\Panel\VotingSettingsController::class, 'resetLink'])->whereNumber(['event', 'item'])->name('event.voting.resetLink');
        Route::get('event/{event}/kalender', [\App\Http\Controllers\Panel\CalendarController::class, 'index'])->whereNumber('event')->name('event.kalender');
        Route::put('event/{event}/kalender/tahapan', [\App\Http\Controllers\Panel\CalendarController::class, 'updatePhases'])->whereNumber('event')->name('event.kalender.tahapan');
        Route::post('event/{event}/kalender/agenda', [\App\Http\Controllers\Panel\CalendarController::class, 'store'])->whereNumber('event')->name('event.kalender.store');
        Route::put('event/{event}/kalender/agenda/{item}', [\App\Http\Controllers\Panel\CalendarController::class, 'update'])->whereNumber(['event', 'item'])->name('event.kalender.update');
        Route::delete('event/{event}/kalender/agenda/{item}', [\App\Http\Controllers\Panel\CalendarController::class, 'destroy'])->whereNumber(['event', 'item'])->name('event.kalender.destroy');
        Route::post('event/{event}/registrasi/checkin', [\App\Http\Controllers\Panel\TicketScanController::class, 'store'])->name('event.scan');
        Route::put('event/{event}/registrasi/form', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'update'])->name('event.form');
        Route::get('event/{event}/registrasi/export', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'export'])->name('event.form.export');
        Route::delete('event/{event}/registrasi/pendaftar/{reg}', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'destroy'])->whereNumber('reg')->name('event.form.destroy');
        Route::get('event/{event}/registrasi/berkas/{reg}/{key}', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'berkas'])->whereNumber('reg')->where('key', 'f_[a-z0-9]+')->name('event.form.file');
        Route::patch('event/{event}/registrasi/pendaftar/{reg}/status', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'review'])->whereNumber('reg')->name('event.form.review');
        Route::get('event/{event}/registrasi/bukti/{reg}', [\App\Http\Controllers\Panel\RegistrationFormController::class, 'bukti'])->whereNumber('reg')->name('event.form.proof');
        Route::get('event/{event}/penilaian', [\App\Http\Controllers\Panel\JudgingController::class, 'index'])->whereNumber('event')->name('event.judging.index');
        Route::post('event/{event}/penilaian/aktif', [\App\Http\Controllers\Panel\JudgingController::class, 'toggle'])->whereNumber('event')->name('event.judging.toggle');
        Route::put('event/{event}/penilaian/kriteria', [\App\Http\Controllers\Panel\JudgingController::class, 'saveCriteria'])->whereNumber('event')->name('event.judging.criteria');
        Route::post('event/{event}/penilaian/juri', [\App\Http\Controllers\Panel\JudgingController::class, 'storeJudge'])->whereNumber('event')->name('event.judging.storeJudge');
        Route::put('event/{event}/penilaian/juri/{item}', [\App\Http\Controllers\Panel\JudgingController::class, 'updateJudge'])->whereNumber(['event', 'item'])->name('event.judging.updateJudge');
        Route::delete('event/{event}/penilaian/juri/{item}', [\App\Http\Controllers\Panel\JudgingController::class, 'destroyJudge'])->whereNumber(['event', 'item'])->name('event.judging.destroyJudge');
        Route::post('event/{event}/penilaian/juri/{item}/link', [\App\Http\Controllers\Panel\JudgingController::class, 'resetLink'])->whereNumber(['event', 'item'])->name('event.judging.resetLink');
        Route::post('event/{event}/penilaian/juri/{item}/tugas', [\App\Http\Controllers\Panel\JudgingController::class, 'assignJudge'])->whereNumber(['event', 'item'])->name('event.judging.assignJudge');
        Route::post('event/{event}/penilaian/juri/{item}/tugas-saudara', [\App\Http\Controllers\Panel\JudgingController::class, 'assignFromSibling'])->whereNumber(['event', 'item'])->name('event.judging.assignFromSibling');
        Route::get('event/{event}/penilaian/juri-event', [\App\Http\Controllers\Panel\JudgingController::class, 'eventJudges'])->whereNumber('event')->name('event.judging.eventJudges');
        Route::post('event/{event}/penilaian/juri/{item}/kategori', [\App\Http\Controllers\Panel\JudgingController::class, 'addToCategory'])->whereNumber(['event', 'item'])->name('event.judging.addToCategory');
        Route::get('event/{event}/penilaian/juri-undangan/cari', [\App\Http\Controllers\Panel\JudgingController::class, 'inviteLookup'])->whereNumber('event')->name('event.judging.inviteLookup');
        Route::post('event/{event}/penilaian/juri-undangan', [\App\Http\Controllers\Panel\JudgingController::class, 'inviteStore'])->whereNumber('event')->name('event.judging.inviteStore');
        Route::delete('event/{event}/penilaian/juri-undangan/{inv}', [\App\Http\Controllers\Panel\JudgingController::class, 'inviteCancel'])->whereNumber(['event', 'inv'])->name('event.judging.inviteCancel');
        Route::post('event/{event}/penilaian/publikasi', [\App\Http\Controllers\Panel\JudgingController::class, 'publish'])->whereNumber('event')->name('event.judging.publish');
        Route::put('event/{event}/penilaian/publikasi/pengaturan', [\App\Http\Controllers\Panel\JudgingController::class, 'savePublication'])->whereNumber('event')->name('event.judging.savePublication');
        Route::post('event/{event}/penilaian/penalti', [\App\Http\Controllers\Panel\JudgingController::class, 'storePenalty'])->whereNumber('event')->name('event.judging.storePenalty');
        Route::post('event/{event}/penilaian/tetapkan', [\App\Http\Controllers\Panel\JudgingController::class, 'finalizeResult'])->whereNumber('event')->name('event.judging.finalize');
        Route::post('event/{event}/penilaian/simpan', [\App\Http\Controllers\Panel\JudgingController::class, 'saveResult'])->whereNumber('event')->name('event.judging.saveResult');
        Route::post('event/{event}/penilaian/buka-kembali', [\App\Http\Controllers\Panel\JudgingController::class, 'reopenResult'])->whereNumber('event')->name('event.judging.reopenResult');
        Route::post('event/{event}/penilaian/seri', [\App\Http\Controllers\Panel\JudgingController::class, 'storeTie'])->whereNumber('event')->name('event.judging.storeTie');
        Route::post('event/{event}/penilaian/sistem', [\App\Http\Controllers\Panel\JudgingController::class, 'setSystem'])->whereNumber('event')->name('event.judging.setSystem');
        Route::post('event/{event}/penilaian/sk/tetapkan-lomba', [\App\Http\Controllers\Panel\JudgingController::class, 'finalizeSkLomba'])->whereNumber('event')->name('event.judging.finalizeSkLomba');
        Route::post('event/{event}/klasemen/bagikan', [\App\Http\Controllers\Panel\JudgingController::class, 'shareKlasemen'])->whereNumber('event')->name('event.judging.klasemenShare');
        Route::put('event/{event}/penilaian/juara-umum', [\App\Http\Controllers\Panel\JudgingController::class, 'saveOverall'])->whereNumber('event')->name('event.judging.saveOverall');
        Route::post('event/{event}/penilaian/juara-umum/tetapkan', [\App\Http\Controllers\Panel\JudgingController::class, 'finalizeOverall'])->whereNumber('event')->name('event.judging.finalizeOverall');
        Route::post('event/{event}/penilaian/juara-umum/simpan', [\App\Http\Controllers\Panel\JudgingController::class, 'saveOverallResult'])->whereNumber('event')->name('event.judging.saveOverallResult');
        Route::post('event/{event}/penilaian/juara-umum/buka', [\App\Http\Controllers\Panel\JudgingController::class, 'reopenOverall'])->whereNumber('event')->name('event.judging.reopenOverall');
        Route::get('event/{event}/klasemen', [\App\Http\Controllers\Panel\JudgingController::class, 'klasemen'])->whereNumber('event')->name('event.judging.klasemen');
        Route::put('event/{event}/penilaian/penalti/{pen}', [\App\Http\Controllers\Panel\JudgingController::class, 'decidePenalty'])->whereNumber(['event', 'pen'])->name('event.judging.decidePenalty');
        Route::get('event/{event}/penilaian/rekap/excel', [\App\Http\Controllers\Panel\JudgingController::class, 'rekapExcel'])->whereNumber('event')->name('event.judging.rekapExcel');
        Route::get('event/{event}/penilaian/rekap/lembar', [\App\Http\Controllers\Panel\JudgingController::class, 'rekapLembar'])->whereNumber('event')->name('event.judging.rekapLembar');
        Route::get('event/{event}/penilaian/rekap/lembar-kosong', [\App\Http\Controllers\Panel\JudgingController::class, 'rekapLembarKosong'])->whereNumber('event')->name('event.judging.rekapLembarKosong');
        Route::get('event/{event}/{menu}', [\App\Http\Controllers\Panel\EventDashboardController::class, 'menu'])->name('event.menu');
        Route::post('event/{event}/tiket/jual', [\App\Http\Controllers\Panel\TicketSettingsController::class, 'toggle'])->whereNumber('event')->name('event.tiket.jual');
        // patch-248: buka/tutup penjualan seluruh rangkaian
        Route::get('event/{event}/tiket/rangkaian', [\App\Http\Controllers\Panel\SeriesTicketController::class, 'status'])->whereNumber('event');
        Route::post('event/{event}/tiket/rangkaian', [\App\Http\Controllers\Panel\SeriesTicketController::class, 'toggle'])->whereNumber('event');
        Route::post('event/{event}/tiket/jenis', [\App\Http\Controllers\Panel\TicketSettingsController::class, 'store'])->whereNumber('event')->name('event.tiket.tambah');
        Route::put('event/{event}/tiket/jenis/{type}', [\App\Http\Controllers\Panel\TicketSettingsController::class, 'update'])->whereNumber(['event', 'type'])->name('event.tiket.ubah');
        Route::delete('event/{event}/tiket/jenis/{type}', [\App\Http\Controllers\Panel\TicketSettingsController::class, 'destroy'])->whereNumber(['event', 'type'])->name('event.tiket.hapus');
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
        Route::get('anggota/cari', [\App\Http\Controllers\Panel\MemberController::class, 'lookup'])->middleware('throttle:20,1')->name('anggota.cari');
        Route::post('anggota', [\App\Http\Controllers\Panel\MemberController::class, 'store'])->name('anggota.store');
        Route::delete('anggota/{member}', [\App\Http\Controllers\Panel\MemberController::class, 'destroy'])->name('anggota.destroy');
        Route::put('anggota/{member}', [\App\Http\Controllers\Panel\MemberController::class, 'update'])->name('anggota.update');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('/profil/edit', [\App\Http\Controllers\ProfileController::class, 'edit']);
    Route::post('/profil', [\App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('/teman', [\App\Http\Controllers\ProfileController::class, 'addFriend']);
    Route::post('/undangan-lembaga/{member}/terima', [\App\Http\Controllers\MemberInvitationController::class, 'accept'])->whereNumber('member');
    Route::post('/undangan-lembaga/{member}/tolak', [\App\Http\Controllers\MemberInvitationController::class, 'decline'])->whereNumber('member');
    Route::post('/undangan-juri/{invitation}/terima', [\App\Http\Controllers\JudgeInvitationController::class, 'accept'])->whereNumber('invitation');
    Route::post('/undangan-juri/{invitation}/tolak', [\App\Http\Controllers\JudgeInvitationController::class, 'decline'])->whereNumber('invitation');
});

Route::middleware(['auth'])->post('/notifikasi/baca', function () { auth()->user()->unreadNotifications->markAsRead(); return back(); });
Route::middleware(['auth'])->post('/notifikasi/{id}/baca', function (string $id) { auth()->user()->unreadNotifications()->whereKey($id)->update(['read_at' => now()]); return response()->noContent(); });

Route::middleware('auth')->group(function () {
    Route::redirect('/lomba-saya', '/event-saya');
    Route::get('/event-saya', [\App\Http\Controllers\MyActivityController::class, 'lomba'])->name('lomba.saya');
    Route::get('/event-saya/{registration}/hasil', [\App\Http\Controllers\MyActivityController::class, 'hasil'])->whereNumber('registration')->name('lomba.hasil');
    Route::get('/juri-saya', [\App\Http\Controllers\JudgeHomeController::class, 'index'])->name('juri.saya');
    Route::get('/tiket', [\App\Http\Controllers\MyActivityController::class, 'tiket'])->name('tiket.saya');
});

Route::middleware(['auth', \App\Http\Middleware\EnsureUserIsAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('pengaturan', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('pengaturan');
        Route::patch('pengaturan', [\App\Http\Controllers\Admin\SettingController::class, 'update'])->name('pengaturan.update');
    });

Route::middleware(['auth', \App\Http\Middleware\EnsureUserIsAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('komentar', [\App\Http\Controllers\Admin\CommentController::class, 'index'])->name('komentar');
        Route::patch('komentar/{comment}/abaikan', [\App\Http\Controllers\Admin\CommentController::class, 'dismiss'])->name('komentar.dismiss');
        Route::delete('komentar/{comment}', [\App\Http\Controllers\Admin\CommentController::class, 'destroy'])->name('komentar.destroy');
    });

Route::middleware('auth')->get('/tickets', fn () => \Inertia\Inertia::render('tickets'))->name('tickets.semua');
Route::get('/voting', [\App\Http\Controllers\VotingPublicController::class, 'index']);
Route::get('/voting/{event}', [\App\Http\Controllers\VotingPublicController::class, 'show'])->whereNumber('event');
Route::get('/voting/{event}/data', [\App\Http\Controllers\VotingPublicController::class, 'data'])->whereNumber('event')->middleware('throttle:120,1');
Route::post('/voting/{event}/beli', [\App\Http\Controllers\VotingPublicController::class, 'buy'])->whereNumber('event')->middleware('throttle:10,1');
Route::get('/foto-peserta/{token}', [\App\Http\Controllers\VotingPhotoController::class, 'show'])->where('token', '[A-Za-z0-9]{32}')->middleware('throttle:60,1');
Route::post('/foto-peserta/{token}', [\App\Http\Controllers\VotingPhotoController::class, 'store'])->where('token', '[A-Za-z0-9]{32}')->middleware('throttle:10,1');
Route::get('/juri/{token}', [\App\Http\Controllers\JudgePublicController::class, 'show'])->where('token', '[A-Za-z0-9]{32}')->middleware('throttle:juri');
Route::post('/juri/{token}', [\App\Http\Controllers\JudgePublicController::class, 'store'])->where('token', '[A-Za-z0-9]{32}')->middleware('throttle:juri');
Route::get('/tiket/{code}', [\App\Http\Controllers\TicketViewController::class, 'show'])->where('code', '[A-Z0-9]{24}')->middleware('throttle:60,1')->name('tiket.lihat');
Route::middleware('auth')->get('/tiket-saya', [\App\Http\Controllers\TicketViewController::class, 'mine'])->name('tiket.saya');

Route::get('/tiket-data', [\App\Http\Controllers\TicketSeriesController::class, 'cards']); // patch-248

Route::get('/klasemen/{event}', fn (\Illuminate\Http\Request $r, \App\Models\Event $event) => app(\App\Http\Controllers\Panel\JudgingController::class)->klasemen($r, $event, true))->whereNumber('event')->name('klasemen.publik');
