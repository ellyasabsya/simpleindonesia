<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Support\Revenue;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalController extends Controller
{
    public const MIN = 50000;
    private const MAX_PIN_TRIES = 5;
    private const LOCK_MINUTES = 15;
    private const HOLD_HOURS = 24;

    /** @return array{0: \App\Models\Institution, 1: bool, 2: bool} lembaga, boleh lihat, boleh tarik */
    private function access(Request $request): array
    {
        $inst = $request->attributes->get('institution');
        $owner = (bool) $request->attributes->get('is_owner');
        $perms = (array) $request->attributes->get('panel_perms', []);

        $withdraw = $owner || in_array('withdraw', $perms, true);
        $view = $withdraw || in_array('finance', $perms, true);

        return [$inst, $view, $withdraw];
    }

    private function fmt($d): ?string
    {
        return $d ? Carbon::parse($d)->locale('id')->translatedFormat('j M Y, H:i') : null;
    }

    private function notifyOwner($inst, string $title, string $message): void
    {
        try {
            $inst->user?->notify(new \App\Notifications\AdminAlert($title, $message, '/panel/pendapatan'));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Mengembalikan pesan error, atau null kalau PIN benar. */
    private function checkPin($user, string $pin): ?string
    {
        $attrs = $user->getAttributes();
        $hash = $attrs['withdrawal_pin'] ?? null;
        if (! $hash) {
            return 'Buat PIN penarikan dulu.';
        }

        $until = $attrs['pin_locked_until'] ?? null;
        if ($until && Carbon::parse($until)->isFuture()) {
            return 'PIN terkunci karena terlalu banyak salah. Coba lagi setelah pukul '.Carbon::parse($until)->format('H:i').'.';
        }

        if (! Hash::check($pin, $hash)) {
            $tries = (int) ($attrs['pin_attempts'] ?? 0) + 1;
            if ($tries >= self::MAX_PIN_TRIES) {
                $user->forceFill(['pin_attempts' => 0, 'pin_locked_until' => now()->addMinutes(self::LOCK_MINUTES)])->save();

                return 'PIN salah '.self::MAX_PIN_TRIES.' kali. PIN dikunci '.self::LOCK_MINUTES.' menit.';
            }
            $user->forceFill(['pin_attempts' => $tries])->save();

            return 'PIN salah. Sisa percobaan: '.(self::MAX_PIN_TRIES - $tries).'.';
        }

        if ((int) ($attrs['pin_attempts'] ?? 0) > 0 || $until) {
            $user->forceFill(['pin_attempts' => 0, 'pin_locked_until' => null])->save();
        }

        return null;
    }

    public function index(Request $request): Response
    {
        [$inst, $canView, $canWithdraw] = $this->access($request);
        abort_unless($canView, 403);

        $user = $request->user();
        $report = Revenue::report($inst->id);

        $history = Withdrawal::with('event:id,title')->where('institution_id', $inst->id)->latest('id')->limit(100)->get();
        $pendingEvents = $history->where('status', Withdrawal::MENUNGGU)->pluck('event_id')->all();

        $hold = $inst->payout_hold_until ? Carbon::parse($inst->payout_hold_until) : null;
        $lock = ($user->getAttributes()['pin_locked_until'] ?? null) ? Carbon::parse($user->getAttributes()['pin_locked_until']) : null;

        [$name, $domain] = array_pad(explode('@', (string) $user->email, 2), 2, '');
        $emailHint = mb_substr($name, 0, 2).'***@'.$domain;

        return Inertia::render('panel/pendapatan', [
            'summary' => [
                'available' => $report['summary']['available'],
                'processing' => $report['summary']['processing'] + $report['summary']['pending'],
                'withdrawn' => $report['summary']['transferred'],
                'held' => $report['summary']['held'],
            ],
            'balances' => $report['balances']->map(fn ($b) => [
                'id' => $b['id'],
                'title' => $b['title'],
                'subtotal' => $b['subtotal'],
                'share' => $b['share'],
                'entitlement' => $b['entitlement'],
                'transferred' => $b['transferred'],
                'processing' => $b['processing'],
                'available' => $b['available'],
                'held' => $b['held'],
                'release_at' => $b['release_at'],
                'blocked' => $b['blocked'],
                'has_pending' => in_array($b['id'], $pendingEvents, true),
            ])->values(),
            'history' => $history->map(fn (Withdrawal $w) => [
                'id' => $w->id,
                'event' => $w->event?->title ?? '-',
                'amount' => (int) $w->amount,
                'bank_name' => $w->bank_name,
                'account_number' => $w->account_number,
                'account_name' => $w->account_name,
                'status' => $w->status,
                'reject_reason' => $w->reject_reason,
                'proof' => $w->transfer_proof ? [
                    'url' => route('panel.penarikan.bukti', $w->id),
                    'is_pdf' => str_ends_with(strtolower($w->transfer_proof), '.pdf'),
                ] : null,
                'requested_at' => $this->fmt($w->created_at),
                'transferred_at' => $this->fmt($w->transferred_at),
            ])->values(),
            'account' => [
                'bank_name' => $inst->payout_bank ?? '',
                'account_number' => $inst->payout_account_number ?? '',
                'account_name' => $inst->payout_account_name ?? '',
            ],
            'hold_until' => $hold && $hold->isFuture() ? $this->fmt($hold) : null,
            'has_pin' => filled($user->getAttributes()['withdrawal_pin'] ?? null),
            'pin_locked_until' => $lock && $lock->isFuture() ? $lock->format('H:i') : null,
            'email_hint' => $emailHint,
            'institution_name' => $inst->name,
            'can_withdraw' => $canWithdraw,
            'min' => self::MIN,
        ]);
    }

    public function sendCode(Request $request): RedirectResponse
    {
        [, , $canWithdraw] = $this->access($request);
        abort_unless($canWithdraw, 403);

        $user = $request->user();
        $code = (string) random_int(100000, 999999);
        Cache::put('wd_code:'.$user->id, Hash::make($code), now()->addMinutes(10));

        try {
            Mail::raw("Kode verifikasi PIN penarikan SIMPLE Anda: {$code}\nBerlaku 10 menit. Jangan berikan kode ini kepada siapa pun.", function ($m) use ($user) {
                $m->to($user->email)->subject('Kode verifikasi PIN penarikan');
            });
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors(['code' => 'Gagal mengirim kode. Coba lagi sebentar lagi.']);
        }

        return back()->with('success', 'Kode verifikasi dikirim ke email akun Anda.');
    }

    public function savePin(Request $request): RedirectResponse
    {
        [$inst, , $canWithdraw] = $this->access($request);
        abort_unless($canWithdraw, 403);

        $user = $request->user();
        $data = $request->validate([
            'password' => ['required', 'string'],
            'code' => ['required', 'digits:6'],
            'pin' => ['required', 'digits:6'],
        ], [
            'password.required' => 'Isi password akun.',
            'code.required' => 'Isi kode verifikasi email.',
            'code.digits' => 'Kode terdiri dari 6 digit.',
            'pin.required' => 'Isi PIN baru.',
            'pin.digits' => 'PIN harus 6 digit angka.',
        ]);

        if (! Hash::check($data['password'], $user->password)) {
            return back()->withErrors(['password' => 'Password salah.']);
        }

        $hash = Cache::get('wd_code:'.$user->id);
        $tries = (int) Cache::get('wd_code_try:'.$user->id, 0);
        if (! $hash || $tries >= self::MAX_PIN_TRIES) {
            return back()->withErrors(['code' => 'Kode kedaluwarsa atau terlalu banyak salah. Kirim kode baru.']);
        }
        if (! Hash::check($data['code'], $hash)) {
            Cache::put('wd_code_try:'.$user->id, $tries + 1, now()->addMinutes(10));

            return back()->withErrors(['code' => 'Kode verifikasi salah.']);
        }

        if (preg_match('/^(\d)\1{5}$/', $data['pin']) || in_array($data['pin'], ['123456', '654321', '012345', '123123'], true)) {
            return back()->withErrors(['pin' => 'PIN terlalu mudah ditebak. Pilih angka lain.']);
        }

        $user->forceFill(['withdrawal_pin' => Hash::make($data['pin']), 'pin_attempts' => 0, 'pin_locked_until' => null])->save();
        Cache::forget('wd_code:'.$user->id);
        Cache::forget('wd_code_try:'.$user->id);

        $this->notifyOwner($inst, 'PIN penarikan diatur', "{$user->name} membuat atau mengubah PIN penarikan dana.");

        return back()->with('success', 'PIN penarikan tersimpan.');
    }

    public function saveAccount(Request $request): RedirectResponse
    {
        [$inst, , $canWithdraw] = $this->access($request);
        abort_unless($canWithdraw, 403);

        $user = $request->user();
        $data = $request->validate([
            'bank_name' => ['required', 'string', 'max:60'],
            'account_number' => ['required', 'string', 'max:40', 'regex:/^[0-9 \-]+$/'],
            'account_name' => ['required', 'string', 'max:100'],
            'pin' => ['nullable', 'digits:6'],
        ], [
            'bank_name.required' => 'Isi nama bank.',
            'account_number.required' => 'Isi nomor rekening.',
            'account_number.regex' => 'Nomor rekening hanya boleh angka.',
            'account_name.required' => 'Isi nama pemilik rekening.',
            'pin.digits' => 'PIN harus 6 digit angka.',
        ]);

        $bank = trim($data['bank_name']);
        $number = trim($data['account_number']);
        $holder = trim($data['account_name']);

        $hadAccount = filled($inst->payout_account_number);
        if ($hadAccount && $bank === $inst->payout_bank && $number === $inst->payout_account_number && $holder === $inst->payout_account_name) {
            return back()->with('success', 'Tidak ada perubahan rekening.');
        }

        if ($hadAccount) {
            if (! filled($user->getAttributes()['withdrawal_pin'] ?? null)) {
                return back()->withErrors(['pin' => 'Buat PIN penarikan dulu sebelum mengganti rekening.']);
            }
            if (empty($data['pin'])) {
                return back()->withErrors(['pin' => 'Masukkan PIN untuk menyimpan rekening.']);
            }
            if ($err = $this->checkPin($user, $data['pin'])) {
                return back()->withErrors(['pin' => $err]);
            }
        }

        $inst->forceFill([
            'payout_bank' => $bank,
            'payout_account_number' => $number,
            'payout_account_name' => $holder,
            'payout_hold_until' => $hadAccount ? now()->addHours(self::HOLD_HOURS) : null,
        ])->save();

        $this->notifyOwner($inst, 'Rekening pencairan diubah', "{$user->name} ".($hadAccount ? 'mengganti' : 'mengatur')." rekening pencairan menjadi {$bank} {$number}.".($hadAccount ? ' Penarikan baru ditahan '.self::HOLD_HOURS.' jam.' : ''));

        return back()->with('success', $hadAccount ? 'Rekening disimpan. Penarikan baru ditahan '.self::HOLD_HOURS.' jam demi keamanan.' : 'Rekening disimpan.');
    }

    public function store(Request $request): RedirectResponse
    {
        [$inst, , $canWithdraw] = $this->access($request);
        abort_unless($canWithdraw, 403);

        $min = self::MIN;
        $data = $request->validate([
            'event_id' => ['required', 'integer'],
            'amount' => ['required', 'integer', "min:{$min}"],
            'pin' => ['required', 'digits:6'],
        ], [
            'amount.required' => 'Isi nominal penarikan.',
            'amount.integer' => 'Nominal harus berupa angka.',
            'amount.min' => 'Minimal penarikan Rp'.number_format($min, 0, ',', '.').'.',
            'pin.required' => 'Masukkan PIN penarikan.',
            'pin.digits' => 'PIN harus 6 digit angka.',
        ]);

        if (! filled($inst->payout_account_number)) {
            return back()->withErrors(['amount' => 'Atur rekening pencairan dulu.']);
        }
        if ($inst->payout_hold_until && Carbon::parse($inst->payout_hold_until)->isFuture()) {
            return back()->withErrors(['amount' => 'Rekening baru diganti. Penarikan bisa diajukan setelah '.$this->fmt($inst->payout_hold_until).'.']);
        }
        if ($err = $this->checkPin($request->user(), $data['pin'])) {
            return back()->withErrors(['pin' => $err]);
        }

        $error = null;

        DB::transaction(function () use ($inst, $data, &$error) {
            \App\Models\Event::where('id', (int) $data['event_id'])->where('institution_id', $inst->id)->lockForUpdate()->first();
            $bal = Revenue::report($inst->id)['balances']->firstWhere('id', (int) $data['event_id']);

            if (! $bal) {
                $error = 'Event tidak ditemukan atau belum punya saldo.';

                return;
            }
            if (Withdrawal::where('event_id', $bal['id'])->where('status', Withdrawal::MENUNGGU)->exists()) {
                $error = 'Masih ada permintaan penarikan yang menunggu untuk event ini.';

                return;
            }
            if ((int) $data['amount'] > $bal['available']) {
                $error = 'Nominal melebihi saldo tersedia (Rp'.number_format($bal['available'], 0, ',', '.').').';

                return;
            }

            Withdrawal::create([
                'institution_id' => $inst->id,
                'event_id' => $bal['id'],
                'amount' => (int) $data['amount'],
                'bank_name' => $inst->payout_bank,
                'account_number' => $inst->payout_account_number,
                'account_name' => $inst->payout_account_name,
                'status' => Withdrawal::MENUNGGU,
            ]);
        });

        if ($error) {
            return back()->withErrors(['amount' => $error]);
        }

        $nominal = number_format((int) $data['amount'], 0, ',', '.');
        \App\Support\AdminNotifier::send(
            'Permintaan penarikan dana baru',
            "{$inst->name} meminta penarikan Rp{$nominal}.",
            '/admin/pendapatan?tab=penarikan&status=menunggu'
        );
        $this->notifyOwner($inst, 'Penarikan dana diajukan', "{$request->user()->name} mengajukan penarikan Rp{$nominal} ke {$inst->payout_bank} {$inst->payout_account_number}.");

        return back()->with('success', 'Permintaan penarikan dikirim. Admin akan memprosesnya.');
    }

    public function proof(Request $request, Withdrawal $withdrawal)
    {
        [$inst, $canView] = $this->access($request);
        abort_unless($canView && $withdrawal->institution_id === $inst->id, 403);

        $path = $withdrawal->transfer_proof;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }
}
