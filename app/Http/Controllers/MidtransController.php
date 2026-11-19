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

        $vo = DB::table('voting_orders')->where('midtrans_order_id', $p['order_id'] ?? '')->first();
        if ($vo) {
            return $this->votingNotification($vo, $p, $midtrans);
        }

        $o = DB::table('ticket_orders')->where('midtrans_order_id', $p['order_id'] ?? '')->first();
        if (! $o) {
            return response('ok');
        }
        if ((int) round((float) ($p['gross_amount'] ?? 0)) !== (int) $o->total) {
            return response('amount mismatch', 400);
        }

        $ts = (string) ($p['transaction_status'] ?? '');
        DB::table('ticket_orders')->where('id', $o->id)->update(['midtrans_status' => $ts, 'updated_at' => now()]);

        if ($midtrans->isPaid($p)) {
            $n = DB::table('ticket_orders')->where('id', $o->id)->whereIn('status', ['menunggu', 'menunggu_verifikasi', 'batal'])
                ->update(['status' => 'lunas', 'paid_at' => now(), 'expires_at' => null, 'updated_at' => now()]);
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

    public function eventToken(int $id, MidtransService $midtrans): JsonResponse
    {
        abort_unless(\App\Models\Setting::midtransOn() && (string) config('midtrans.server_key') !== '', 503);
        $e = \App\Models\Event::whereNull('parent_id')->where('payment_status', 'menunggu_pembayaran')->findOrFail($id);
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
                    ->update(['payment_status' => 'lunas', 'updated_at' => now()]);
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
            DB::table('voting_orders')->where('id', $o->id)->whereIn('status', ['menunggu', 'batal'])
                ->update(['status' => 'lunas', 'paid_at' => now(), 'updated_at' => now()]);
        } elseif (in_array($ts, ['expire', 'cancel', 'deny'], true)) {
            DB::table('voting_orders')->where('id', $o->id)->where('status', 'menunggu')
                ->update(['status' => 'batal', 'updated_at' => now()]);
        }

        return response('ok');
    }
}
