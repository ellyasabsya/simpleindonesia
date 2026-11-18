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

        $agg = [];
        $sales = DB::table('ticket_orders')->where('status', 'lunas')
            ->selectRaw('event_id, sum(subtotal) as subtotal, sum(fee) as fee, sum(total) as total')
            ->groupBy('event_id')->get();
        foreach ($sales as $s) {
            $main = $parentOf[$s->event_id] ?? $s->event_id;
            $agg[$main] ??= ['subtotal' => 0, 'fee' => 0, 'total' => 0];
            $agg[$main]['subtotal'] += (int) $s->subtotal;
            $agg[$main]['fee'] += (int) $s->fee;
            $agg[$main]['total'] += (int) $s->total;
        }

        $w = [];
        $wd = DB::table('withdrawals')->selectRaw('event_id, status, sum(amount) as amt')->groupBy('event_id', 'status')->get();
        foreach ($wd as $r) {
            $w[$r->event_id][$r->status] = (int) $r->amt;
        }

        $rows = [];
        $packagePaid = 0;
        $packageCount = 0;

        foreach ($mains as $e) {
            $snap = $e->package_snapshot ?? [];

            if ($e->payment_status === 'lunas') {
                $amt = (int) ($snap['estimated_upfront'] ?? 0);
                if ($amt > 0) {
                    $packagePaid += $amt;
                    $packageCount++;
                }
            }

            $a = $agg[$e->id] ?? ['subtotal' => 0, 'fee' => 0, 'total' => 0];
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
                'share' => $share,
                'entitlement' => $entitlement,
                'transferred' => $ditransfer,
                'processing' => $menunggu + $disetujui,
                'pending' => $menunggu,
                'approved' => $disetujui,
                'available' => max(0, $entitlement - $menunggu - $disetujui - $ditransfer),
            ];
        }

        $rows = collect($rows)->sortByDesc('subtotal')->values();

        $fee = (int) $rows->sum('fee');
        $share = (int) $rows->sum('share');

        return [
            'balances' => $rows,
            'summary' => [
                'total_paid' => (int) $rows->sum('total'),
                'fee' => $fee,
                'share' => $share,
                'package' => $packagePaid,
                'package_count' => $packageCount,
                'platform' => $fee + $share + $packagePaid,
                'entitlement' => (int) $rows->sum('entitlement'),
                'transferred' => (int) $rows->sum('transferred'),
                'processing' => (int) $rows->sum('approved'),
                'pending' => (int) $rows->sum('pending'),
                'available' => (int) $rows->sum('available'),
            ],
        ];
    }
}
