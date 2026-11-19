<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TicketIssuer
{
    /** Buat tiket per pemegang untuk order lunas, lalu kirim email. Aman dipanggil dua kali. */
    public static function issue(int $orderId): void
    {
        $o = DB::table('ticket_orders')->where('id', $orderId)->first();
        if (! $o || $o->status !== 'lunas') {
            return;
        }
        if (DB::table('ticket_holders')->where('ticket_order_id', $orderId)->exists()) {
            return;
        }

        $names = json_decode((string) $o->holders, true) ?: [];
        $now = now();
        $rows = [];
        foreach (array_values($names) as $name) {
            $rows[] = [
                'ticket_order_id' => $o->id,
                'event_id' => $o->event_id,
                'ticket_type_id' => $o->ticket_type_id,
                'code' => strtoupper(Str::random(24)),
                'holder_name' => (string) $name,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        if ($rows) {
            // patch-256: beri ID registrasi (mis. BB-UMUM-2026-001) pada setiap pemegang tiket
            $__ev = DB::table('ticket_orders')->where('id', $orderId)->value('event_id');
            $__grp = DB::table('ticket_orders')->where('id', $orderId)->value('group_code'); // patch-257
            $__cat = DB::table('ticket_types as t')->leftJoin('event_participant_categories as c', 'c.id', '=', 't.participant_category_id')
                ->where('t.id', $o->ticket_type_id)->value('c.name');
            foreach ($rows as &$__r) {
                // patch-257: orang yang sama dalam satu pembelian gabungan memakai satu ID peserta
                $__pc = null;
                if ($__grp) {
                    $__pc = DB::table('ticket_holders as h')->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
                        ->where('o.group_code', $__grp)
                        ->whereRaw('LOWER(TRIM(h.holder_name)) = ?', [mb_strtolower(trim((string) ($__r['holder_name'] ?? '')))])
                        ->whereNotNull('h.participant_code')->orderBy('h.id')->value('h.participant_code');
                }
                $__eid = (int) ($__r['event_id'] ?? $__ev);
                $__pc = $__pc ?: \App\Support\RegistrationCode::existingTicketCode($__eid, $o->user_id ? (int) $o->user_id : null, (string) ($__r['holder_name'] ?? '')) ?: \App\Support\RegistrationCode::make($__eid, $__cat ?: null);
                $__r['participant_code'] = $__pc;
                $__r['reg_code'] = $__r['reg_code'] ?? \App\Support\RegistrationCode::regCode($__pc, $__eid);
            }
            unset($__r);
            DB::table('ticket_holders')->insert($rows);
        }

        self::notify($o);
    }

    private static function notify(object $o): void
    {
        $title = (string) DB::table('events')->where('id', $o->event_id)->value('title');
        $tickets = DB::table('ticket_holders')->where('ticket_order_id', $o->id)->get(['code', 'holder_name']);

        $body = "Halo {$o->buyer_name},\n\nPembayaran Anda untuk \"{$title}\" sudah kami verifikasi. Tiket Anda siap.\n\n";
        foreach ($tickets as $t) {
            $body .= "{$t->holder_name}: ".url('/tiket/'.$t->code)."\n";
        }
        $body .= "\nBuka tautan tiket untuk menampilkan QR code saat check-in. Tiket juga ada di menu Tiket Saya jika Anda login.\n";

        if ($o->user_id) {
            try {
                \App\Models\User::find($o->user_id)?->notify(new \App\Notifications\AdminAlert(
                    'Tiket Anda sudah terbit',
                    "Pesanan {$o->code} untuk \"{$title}\" sudah disetujui. Tiket Anda siap.",
                    '/tiket',
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        try {
            Mail::raw($body, fn ($m) => $m->to($o->buyer_email)->subject("Tiket Anda: {$title}"));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
