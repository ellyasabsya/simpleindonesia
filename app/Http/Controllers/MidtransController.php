<?php

namespace App\Http\Controllers;

use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MidtransController extends Controller
{
    /** Dipanggil frontend setelah pesanan dibuat: kembalikan Snap token. */
    public function token(string $code, MidtransService $midtrans): JsonResponse
    {
        abort_unless(\App\Models\Setting::midtransOn(), 503);
        $o = DB::table('ticket_orders')->where('code', $code)->where('payment_method', 'midtrans')->first();
        abort_unless($o && $o->status === 'menunggu', 404);

        $orderId = $o->code.'-'.time();
        try {
            $token = $midtrans->snapToken($orderId, (int) $o->total, [
                'first_name' => $o->buyer_name,
                'email' => filter_var($o->buyer_email, FILTER_VALIDATE_EMAIL) ? $o->buyer_email : null,
                'phone' => $o->buyer_phone,
            ], [[
                'id' => 'TIKET-'.$o->ticket_type_id,
                'price' => (int) $o->total,
                'quantity' => 1,
                'name' => 'Tiket '.$o->code,
            ]]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Gagal membuat pembayaran. Coba lagi.'], 502);
        }

        DB::table('ticket_orders')->where('id', $o->id)->update(['midtrans_order_id' => $orderId, 'updated_at' => now()]);

        return response()->json(['token' => $token, 'client_key' => config('midtrans.client_key'), 'sandbox' => ! config('midtrans.is_production')]);
    }

    /** Webhook dari Midtrans (tanpa CSRF, diverifikasi lewat signature). */
    public function notification(Request $request, MidtransService $midtrans)
    {
        $p = $request->all();
        if (! $midtrans->validSignature($p)) {
            return response('invalid signature', 403);
        }

        $oid = (string) ($p['order_id'] ?? '');
        if (preg_match('/^PKT-(\d+)-\d+$/', $oid, $m)) {
            return $this->eventNotification((int) $m[1], $p, $midtrans);
        }

        $vo = preg_match('/^VOT-([A-Z0-9]{10})-\d+$/', $oid, $m)
            ? DB::table('voting_orders')->where('code', $m[1])->first()
            : null;
        if ($vo) {
            return $this->votingNotification($vo, $p, $midtrans);
        }

        $o = preg_match('/^(TKT-[A-Z0-9]{8})-\d+$/', $oid, $m)
            ? DB::table('ticket_orders')->where('code', $m[1])->where('payment_method', 'midtrans')->first()
            : null;
        if (! $o) {
            \Illuminate\Support\Facades\Log::warning('Midtrans: notifikasi tanpa pesanan', ['order_id' => $oid, 'amount' => $p['gross_amount'] ?? null, 'status' => $p['transaction_status'] ?? null]);

            return response('ok');
        }
        if ((int) round((float) ($p['gross_amount'] ?? 0)) !== (int) $o->total) {
            return response('amount mismatch', 400);
        }

        $ts = (string) ($p['transaction_status'] ?? '');
        DB::table('ticket_orders')->where('id', $o->id)->update(['midtrans_status' => $ts, 'updated_at' => now()]);

        if ($midtrans->isPaid($p)) {
            $n = DB::table('ticket_orders')->where('id', $o->id)->whereIn('status', ['menunggu', 'menunggu_verifikasi', 'batal'])
                ->update(['status' => 'lunas', 'paid_at' => now(), 'expires_at' => null, 'updated_at' => now()] + $this->mdr($p ?? []));
            if ($n === 1) {
                try {
                    \App\Support\TicketIssuer::issue((int) $o->id);
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        } elseif (in_array($ts, ['expire', 'cancel', 'deny'], true)) {
            DB::table('ticket_orders')->where('id', $o->id)->where('status', 'menunggu')
                ->update(['status' => 'batal', 'updated_at' => now()]);
        }

        return response('ok');
    }

    /** Sinkronisasi status tiket ke Midtrans (cadangan bila webhook belum masuk). */
    public function ticketSync(string $code, MidtransService $midtrans): JsonResponse
    {
        $o = DB::table('ticket_orders')->where('code', $code)->where('payment_method', 'midtrans')->first();
        abort_unless($o && $o->midtrans_order_id, 404);

        try {
            $p = $midtrans->status($o->midtrans_order_id);
            if ((int) round((float) ($p['gross_amount'] ?? 0)) === (int) $o->total) {
                $ts = (string) ($p['transaction_status'] ?? '');
                DB::table('ticket_orders')->where('id', $o->id)->update(['midtrans_status' => $ts, 'updated_at' => now()]);

                if ($midtrans->isPaid($p)) {
                    $n = DB::table('ticket_orders')->where('id', $o->id)->whereIn('status', ['menunggu', 'menunggu_verifikasi', 'batal'])
                        ->update(['status' => 'lunas', 'paid_at' => now(), 'expires_at' => null, 'updated_at' => now()] + $this->mdr($p ?? []));
                    if ($n === 1) {
                        \App\Support\TicketIssuer::issue((int) $o->id);
                    }
                } elseif (in_array($ts, ['expire', 'cancel', 'deny'], true)) {
                    DB::table('ticket_orders')->where('id', $o->id)->where('status', 'menunggu')
                        ->update(['status' => 'batal', 'updated_at' => now()]);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['status' => DB::table('ticket_orders')->where('id', $o->id)->value('status')]);
    }

    /** Jenis pembayaran dan estimasi MDR dari payload Midtrans. */
    private function mdr(array $p): array
    {
        $type = $p['payment_type'] ?? null;

        return [
            'midtrans_payment_type' => $type,
            'mdr_fee' => \App\Support\MidtransFee::estimate($type, (int) round((float) ($p['gross_amount'] ?? 0))),
        ];
    }

    private function eventNotification(int $id, array $p, MidtransService $midtrans)
    {
        $e = \App\Models\Event::whereNull('parent_id')->find($id);
        if (! $e) {
            \Illuminate\Support\Facades\Log::warning('Midtrans: notifikasi paket tanpa event', ['order_id' => $p['order_id'] ?? null, 'amount' => $p['gross_amount'] ?? null]);

            return response('ok');
        }
        if ((int) round((float) ($p['gross_amount'] ?? 0)) !== (int) ($e->package_snapshot['estimated_upfront'] ?? 0)) {
            return response('amount mismatch', 400);
        }
        if ($midtrans->isPaid($p)) {
            $n = DB::table('events')->where('id', $e->id)->where('payment_status', 'menunggu_pembayaran')
                ->update(['payment_status' => 'lunas', 'updated_at' => now()] + $this->mdr($p ?? []));
            if ($n > 0) {
                \App\Support\AdminNotifier::send('Event baru menunggu review', "Event \"{$e->title}\" sudah dibayar online.", '/admin/review');
            }
        }

        return response('ok');
    }

    /** Snap token untuk pesanan vote. */
    public function voteToken(string $code, MidtransService $midtrans): JsonResponse
    {
        abort_unless(\App\Models\Setting::votingOpen(), 503);
        $o = DB::table('voting_orders')->where('code', $code)->first();
        abort_unless($o && $o->status === 'menunggu', 404);

        $orderId = 'VOT-'.$o->code.'-'.time();
        try {
            $token = $midtrans->snapToken($orderId, (int) $o->amount, [
                'first_name' => $o->buyer_name,
                ...(filter_var($o->buyer_email, FILTER_VALIDATE_EMAIL) ? ['email' => $o->buyer_email] : []),
            ], [[
                'id' => 'VOTE-'.$o->id,
                'price' => (int) $o->amount,
                'quantity' => 1,
                'name' => 'Vote '.$o->votes.' ('.$o->code.')',
            ]]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Gagal membuat pembayaran. Coba lagi.'], 502);
        }

        DB::table('voting_orders')->where('id', $o->id)->update(['midtrans_order_id' => $orderId, 'updated_at' => now()]);

        return response()->json(['token' => $token, 'client_key' => config('midtrans.client_key'), 'sandbox' => ! config('midtrans.is_production')]);
    }

    /** Sinkronisasi status vote ke Midtrans (cadangan bila webhook belum masuk). */
    public function voteSync(string $code, MidtransService $midtrans): JsonResponse
    {
        $o = DB::table('voting_orders')->where('code', $code)->first();
        abort_unless($o && $o->midtrans_order_id, 404);

        try {
            $p = $midtrans->status($o->midtrans_order_id);
            $this->votingNotification($o, $p, $midtrans);
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['status' => DB::table('voting_orders')->where('id', $o->id)->value('status')]);
    }

    public function eventToken(\Illuminate\Http\Request $request, int $id, MidtransService $midtrans): JsonResponse
    {
        abort_unless(\App\Models\Setting::midtransOn() && (string) config('midtrans.server_key') !== '', 503);
        $inst = $request->attributes->get('institution');
        abort_unless($inst, 403);
        $e = \App\Models\Event::whereNull('parent_id')->where('institution_id', $inst->id)->where('payment_status', 'menunggu_pembayaran')->findOrFail($id);
        $amount = (int) (($e->package_snapshot['estimated_upfront'] ?? 0));
        abort_unless($amount > 0, 422);

        $orderId = 'PKT-'.$e->id.'-'.time();
        try {
            $token = $midtrans->snapToken($orderId, $amount, [
                'first_name' => $e->institution?->name ?? 'Lembaga',
            ], [[
                'id' => 'PKT-'.$e->id,
                'price' => $amount,
                'quantity' => 1,
                'name' => 'Paket event: '.\Illuminate\Support\Str::limit($e->title, 60, ''),
            ]]);
        } catch (\Throwable $ex) {
            report($ex);

            return response()->json(['message' => 'Gagal membuat pembayaran. Coba lagi.'], 502);
        }

        DB::table('events')->where('id', $e->id)->update(['midtrans_order_id' => $orderId, 'updated_at' => now()]);

        return response()->json(['token' => $token, 'client_key' => config('midtrans.client_key'), 'sandbox' => ! config('midtrans.is_production')]);
    }

    /** Sinkronisasi pembayaran paket event ke Midtrans (cadangan bila webhook belum masuk). */
    public function eventSync(int $id, MidtransService $midtrans): JsonResponse
    {
        $e = \App\Models\Event::whereNull('parent_id')->findOrFail($id);
        abort_unless($e->midtrans_order_id, 404);

        try {
            $p = $midtrans->status($e->midtrans_order_id);
            $amount = (int) (($e->package_snapshot['estimated_upfront'] ?? 0));
            if ((int) round((float) ($p['gross_amount'] ?? 0)) === $amount && $midtrans->isPaid($p)) {
                $n = DB::table('events')->where('id', $e->id)->where('payment_status', 'menunggu_pembayaran')
                    ->update(['payment_status' => 'lunas', 'updated_at' => now()] + $this->mdr($p ?? []));
                if ($n > 0) {
                    \App\Support\AdminNotifier::send('Event baru menunggu review', "Event \"{$e->title}\" sudah dibayar online.", '/admin/review');
                }
            }
        } catch (\Throwable $ex) {
            report($ex);
        }

        return response()->json(['status' => DB::table('events')->where('id', $e->id)->value('payment_status')]);
    }

    private function votingNotification(object $o, array $p, MidtransService $midtrans)
    {
        if ((int) round((float) ($p['gross_amount'] ?? 0)) !== (int) $o->amount) {
            return response('amount mismatch', 400);
        }

        $ts = (string) ($p['transaction_status'] ?? '');
        DB::table('voting_orders')->where('id', $o->id)->update(['midtrans_status' => $ts, 'updated_at' => now()]);

        if ($midtrans->isPaid($p)) {
            // Idempotent: hanya berubah sekali, notifikasi ganda tidak menambah vote.
            $n = DB::table('voting_orders')->where('id', $o->id)->whereIn('status', ['menunggu', 'batal'])
                ->update(['status' => 'lunas', 'paid_at' => now(), 'updated_at' => now()] + $this->mdr($p ?? []));
            if ($n > 0) {
                $evTitle = (string) DB::table('events')->where('id', $o->event_id)->value('title');
                \App\Support\AdminNotifier::send(
                    'Pembayaran vote berhasil',
                    $o->buyer_name.' membeli '.number_format((int) $o->votes, 0, ',', '.').' vote (Rp '.number_format((int) $o->amount, 0, ',', '.').') untuk event "'.$evTitle.'".',
                    '/admin/transaksi'
                );
            }
        } elseif (in_array($ts, ['expire', 'cancel', 'deny'], true)) {
            DB::table('voting_orders')->where('id', $o->id)->where('status', 'menunggu')
                ->update(['status' => 'batal', 'updated_at' => now()]);
        }

        return response('ok');
    }
}
