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
        $o = DB::table('voting_orders')->where('code', $code)->first();
        abort_unless($o && $o->status === 'menunggu', 404);

        $orderId = 'VOT-'.$o->code.'-'.time();
        try {
            $token = $midtrans->snapToken($orderId, (int) $o->amount, [
                'first_name' => $o->buyer_name,
                'email' => filter_var($o->buyer_email, FILTER_VALIDATE_EMAIL) ? $o->buyer_email : null,
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
