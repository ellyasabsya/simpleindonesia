<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TicketProofController extends Controller
{
    /** Pembeli mengunggah bukti transfer baru untuk pesanan yang ditolak admin. */
    public function update(Request $request, string $code): RedirectResponse
    {
        $request->validate(
            ['payment_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120']],
            [
                'payment_proof.required' => 'Pilih file bukti transfer.',
                'payment_proof.mimes' => 'Bukti transfer harus JPG, PNG, WebP, atau PDF.',
                'payment_proof.max' => 'Ukuran bukti transfer maksimal 5 MB.',
            ]
        );

        $u = $request->user();
        $o = DB::table('ticket_orders')->where('code', $code)
            ->where(function ($q) use ($u) {
                $q->where('user_id', $u->id);
                if ($u->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(buyer_email)) = ?', [mb_strtolower(trim($u->email))]);
                }
            })->first();
        abort_unless($o && $o->status === 'batal' && $o->rejected_at !== null && $o->payment_method !== 'midtrans', 404);

        $ev = Event::find($o->event_id);
        if (! $ev || $ev->status !== Event::PUBLISHED) {
            throw ValidationException::withMessages(['payment_proof' => 'Event ini sudah tidak menerima pesanan.']);
        }

        $ids = $o->group_code
            ? DB::table('ticket_orders')->where('group_code', $o->group_code)->where('status', 'batal')->whereNotNull('rejected_at')->pluck('id')->all()
            : [$o->id];

        $path = \App\Support\ImageUploader::store($request->file('payment_proof'), 'payment-proofs/tiket', 'payment_proof', 1600, 'local');
        $old = [];

        try {
            DB::transaction(function () use ($ids, $path, &$old) {
                foreach ($ids as $id) {
                    $r = DB::table('ticket_orders')->where('id', $id)->lockForUpdate()->first();
                    if (! $r || $r->status !== 'batal') {
                        continue;
                    }
                    $quota = (int) DB::table('ticket_types')->where('id', $r->ticket_type_id)->lockForUpdate()->value('quota');
                    $sold = (int) DB::table('ticket_orders')->where('ticket_type_id', $r->ticket_type_id)->where('id', '!=', $r->id)
                        ->where('status', '!=', 'batal')
                        ->where(fn ($q) => $q->where('status', '!=', 'menunggu')->orWhere('expires_at', '>', now()))
                        ->sum('quantity');
                    if ((int) $r->quantity > $quota - $sold) {
                        throw ValidationException::withMessages(['payment_proof' => 'Sisa tiket sudah tidak cukup untuk pesanan ini. Silakan buat pesanan baru.']);
                    }
                    if ($r->payment_proof) {
                        $old[] = $r->payment_proof;
                    }
                    DB::table('ticket_orders')->where('id', $id)->update([
                        'status' => 'menunggu_verifikasi',
                        'payment_proof' => $path,
                        'rejected_at' => null,
                        'reject_reason' => null,
                        'updated_at' => now(),
                    ]);
                }
            });
        } catch (\Throwable $e) {
            try {
                Storage::disk('local')->delete($path);
            } catch (\Throwable) {
            }
            throw $e;
        }

        foreach (array_unique($old) as $f) {
            try {
                if ($f !== $path) {
                    Storage::disk('local')->delete($f);
                }
            } catch (\Throwable) {
            }
        }

        \App\Support\AdminNotifier::send(
            'Bukti transfer dikirim ulang',
            "Pesanan {$o->code} atas nama {$o->buyer_name} mengirim bukti transfer baru dan menunggu verifikasi.",
            '/admin/pesanan-tiket'
        );
        \App\Support\TicketMail::send(
            $o->buyer_email,
            'Bukti transfer pesanan '.$o->code.' diterima ulang',
            "Halo {$o->buyer_name},\n\nBukti transfer baru untuk pesanan {$o->code} sudah kami terima dan sedang diverifikasi admin. Tiket (QR code) akan dikirim ke email ini setelah disetujui."
        );

        return back()->with('success', 'Bukti transfer dikirim. Pesanan Anda menunggu verifikasi admin.');
    }
}
