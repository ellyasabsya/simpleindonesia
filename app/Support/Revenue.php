<?php

namespace App\Support;

use App\Models\Event;
use Illuminate\Support\Facades\DB;

class Revenue
{
    /**
     * Laporan pendapatan dan saldo per event utama.
     * Subtotal tiket lunas = hak penyelenggara (dikurangi bagi hasil paket).
     * Biaya layanan dibayar pembeli di atas harga, jadi tidak mengurangi saldo lembaga.
     */
    public static function report(?int $institutionId = null): array
    {
        $mains = Event::whereNull('parent_id')
            ->when($institutionId, fn ($q) => $q->where('institution_id', $institutionId))
            ->with('institution:id,name')->get();

        $parentOf = Event::whereNotNull('parent_id')->pluck('parent_id', 'id')->all();

        // Tanggal selesai terakhir per event utama (event utama + semua sub-event).
        $endOf = [];
        foreach (Event::select('id', 'parent_id', 'ends_at')->get() as $ev) {
            if (! $ev->ends_at) {
                continue;
            }
            $t = \Illuminate\Support\Carbon::parse($ev->ends_at);
            $k = $ev->parent_id ?? $ev->id;
            if (! isset($endOf[$k]) || $t->gt($endOf[$k])) {
                $endOf[$k] = $t;
            }
        }
        $holdDays = (int) config('revenue.hold_days', 3);

        $agg = [];
        $lastPaid = [];
        $sales = DB::table('ticket_orders')->where('status', 'lunas')
            ->selectRaw('event_id, sum(subtotal) as subtotal, sum(fee) as fee, sum(total) as total, sum(mdr_fee) as mdr, max(paid_at) as last_paid')
            ->groupBy('event_id')->get();
        foreach ($sales as $s) {
            $main = $parentOf[$s->event_id] ?? $s->event_id;
            $lastPaid[$main] = max($lastPaid[$main] ?? '', (string) $s->last_paid);
            $agg[$main] ??= ['subtotal' => 0, 'fee' => 0, 'total' => 0, 'mdr' => 0];
            $agg[$main]['subtotal'] += (int) $s->subtotal;
            $agg[$main]['fee'] += (int) $s->fee;
            $agg[$main]['total'] += (int) $s->total;
            $agg[$main]['mdr'] += (int) $s->mdr;
        }

        // Vote lunas: harga vote = hak penyelenggara, biaya layanan = platform (sama seperti tiket).
        $votes = DB::table('voting_orders')->where('status', 'lunas')
            ->selectRaw('event_id, sum(amount - service_fee) as subtotal, sum(service_fee) as fee, sum(amount) as total, sum(mdr_fee) as mdr, max(paid_at) as last_paid')
            ->groupBy('event_id')->get();
        foreach ($votes as $v) {
            $main = $parentOf[$v->event_id] ?? $v->event_id;
            $lastPaid[$main] = max($lastPaid[$main] ?? '', (string) $v->last_paid);
            $agg[$main] ??= ['subtotal' => 0, 'fee' => 0, 'total' => 0, 'mdr' => 0];
            $agg[$main]['subtotal'] += (int) $v->subtotal;
            $agg[$main]['fee'] += (int) $v->fee;
            $agg[$main]['total'] += (int) $v->total;
            $agg[$main]['mdr'] += (int) $v->mdr;
        }

        $w = [];
        $wd = DB::table('withdrawals')->selectRaw('event_id, status, sum(amount) as amt')->groupBy('event_id', 'status')->get();
        foreach ($wd as $r) {
            $w[$r->event_id][$r->status] = (int) $r->amt;
        }

        $rows = [];
        $packagePaid = 0;
        $packageCount = 0;
        $packageMdr = 0;
        $packageRefunded = 0;
        $packageRefundedCount = 0;

        foreach ($mains as $e) {
            $snap = $e->package_snapshot ?? [];

            if (in_array($e->payment_status, ['lunas', 'dikembalikan'], true)) {
                $packageMdr += (int) $e->mdr_fee;
            }
            if ($e->payment_status === 'dikembalikan') {
                $refAmt = (int) ($snap['estimated_upfront'] ?? 0);
                if ($refAmt > 0) {
                    $packageRefunded += $refAmt;
                    $packageRefundedCount++;
                }
            }

            if ($e->payment_status === 'lunas') {
                $amt = (int) ($snap['estimated_upfront'] ?? 0);
                if ($amt > 0) {
                    $packagePaid += $amt;
                    $packageCount++;
                }
            }

            $a = $agg[$e->id] ?? ['subtotal' => 0, 'fee' => 0, 'total' => 0, 'mdr' => 0];
            $x = $w[$e->id] ?? [];
            if ($a['subtotal'] === 0 && ! $x) {
                continue;
            }

            $pct = ($snap['payment_type'] ?? null) === 'revenue_share' ? (float) ($snap['share_percent'] ?? 0) : 0.0;
            $share = (int) round($a['subtotal'] * $pct / 100);
            $entitlement = $a['subtotal'] - $share;
            $menunggu = $x['menunggu'] ?? 0;
            $disetujui = $x['disetujui'] ?? 0;
            $ditransfer = $x['ditransfer'] ?? 0;
            $free = max(0, $entitlement - $menunggu - $disetujui - $ditransfer);
            $base = $endOf[$e->id] ?? null;
            $lp = ! empty($lastPaid[$e->id]) ? \Illuminate\Support\Carbon::parse($lastPaid[$e->id]) : null;
            if ($lp && (! $base || $lp->gt($base))) {
                $base = $lp;
            }
            $releaseAt = $base?->copy()->addDays($holdDays);
            $rejected = $e->status === Event::REJECTED;
            $held = $rejected || $releaseAt === null || now()->lt($releaseAt);

            $rows[] = [
                'id' => $e->id,
                'title' => $e->title,
                'institution_id' => $e->institution_id,
                'institution' => $e->institution?->name ?? '-',
                'package' => $snap['name'] ?? '-',
                'share_percent' => $pct,
                'subtotal' => $a['subtotal'],
                'fee' => $a['fee'],
                'total' => $a['total'],
                'mdr' => $a['mdr'],
                'share' => $share,
                'entitlement' => $entitlement,
                'transferred' => $ditransfer,
                'processing' => $menunggu + $disetujui,
                'pending' => $menunggu,
                'approved' => $disetujui,
                'available' => $held ? 0 : $free,
                'held' => $held ? $free : 0,
                'release_at' => $rejected ? null : $releaseAt?->toIso8601String(),
                'blocked' => $rejected,
            ];
        }

        $rows = collect($rows)->sortByDesc('subtotal')->values();

        $fee = (int) $rows->sum('fee');
        $share = (int) $rows->sum('share');
        $mdr = (int) $rows->sum('mdr') + $packageMdr;

        return [
            'balances' => $rows,
            'summary' => [
                'total_paid' => (int) $rows->sum('total'),
                'fee' => $fee,
                'share' => $share,
                'package' => $packagePaid,
                'package_count' => $packageCount,
                'platform' => $fee + $share + $packagePaid,
                'mdr' => $mdr,
                'platform_net' => $fee + $share + $packagePaid - $mdr,
                'package_refunded' => $packageRefunded,
                'package_refunded_count' => $packageRefundedCount,
                'held' => (int) $rows->sum('held'),
                'entitlement' => (int) $rows->sum('entitlement'),
                'transferred' => (int) $rows->sum('transferred'),
                'processing' => (int) $rows->sum('approved'),
                'pending' => (int) $rows->sum('pending'),
                'available' => (int) $rows->sum('available'),
            ],
        ];
    }
}
