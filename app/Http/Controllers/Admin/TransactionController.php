<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        [$rows, $summary, $f] = $this->build($request);

        $total = $rows->count();
        $last = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min(max(1, (int) $request->query('page', 1)), $last);
        $items = $rows->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values();

        return Inertia::render('admin/transaksi', [
            'rows' => $items,
            'summary' => $summary,
            'filters' => $f,
            'pg' => [
                'current' => $page,
                'last' => $last,
                'total' => $total,
                'from' => $total ? ($page - 1) * self::PER_PAGE + 1 : null,
                'to' => $total ? min($page * self::PER_PAGE, $total) : null,
            ],
        ]);
    }

    public function csv(Request $request)
    {
        [$rows] = $this->build($request);

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Tanggal', 'Kode', 'Jenis', 'Arah', 'Keterangan', 'Detail', 'Metode', 'Status', 'Jumlah', 'Biaya Layanan']);
            foreach ($rows as $r) {
                fputcsv($out, [$r['at'], $r['code'], $r['type'], $r['dir'], $r['title'], $r['subtitle'], $r['method'], $r['status'], $r['amount'], $r['fee']]);
            }
            fclose($out);
        }, 'transaksi-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return array{0: Collection, 1: array, 2: array} */
    private function build(Request $request): array
    {
        $all = $request->query('range') === 'semua';
        $from = $all ? '' : (string) $request->query('from', now()->toDateString());
        $to = $all ? '' : (string) $request->query('to', now()->toDateString());

        $f = [
            'range' => $all ? 'semua' : 'tanggal',
            'from' => $from,
            'to' => $to,
            'type' => (string) $request->query('type', 'semua'),
            'dir' => (string) $request->query('dir', 'semua'),
            'method' => (string) $request->query('method', 'semua'),
            'status' => (string) $request->query('status', 'lunas'),
            'q' => trim((string) $request->query('q', '')),
        ];

        // Lewati sumber data yang pasti tidak dipakai oleh filter jenis/arah.
        $wantTiket = in_array($f['type'], ['semua', 'tiket'], true) && in_array($f['dir'], ['semua', 'masuk'], true);
        $wantPaket = in_array($f['type'], ['semua', 'paket'], true) && in_array($f['dir'], ['semua', 'masuk'], true);
        $wantTarik = in_array($f['type'], ['semua', 'penarikan'], true) && in_array($f['dir'], ['semua', 'keluar'], true);
        $wantVote = in_array($f['type'], ['semua', 'vote'], true) && in_array($f['dir'], ['semua', 'masuk'], true);

        $events = ($wantTiket || $wantPaket || $wantTarik || $wantVote)
            ? Event::with('institution:id,name')->get()->keyBy('id')
            : collect();
        $rows = collect();

        // Filter tanggal dijalankan di database supaya baris di luar rentang tidak dimuat ke PHP.
        $inRange = function ($query, string $expr) use ($all, $from, $to) {
            if (! $all) {
                if ($from !== '') {
                    $query->whereRaw($expr.' >= ?', [$from]);
                }
                if ($to !== '') {
                    $query->whereRaw($expr.' <= ?', [$to]);
                }
            }

            return $query;
        };

        // Tiket
        if ($wantTiket) {
            $tickets = $inRange(
                DB::table('ticket_orders')->select(['id', 'event_id', 'code', 'buyer_name', 'status', 'payment_method', 'paid_at', 'created_at', 'total', 'fee']),
                'DATE(COALESCE(paid_at, created_at))'
            );
            foreach ($tickets->cursor() as $o) {
                $ev = $events[$o->event_id] ?? null;
                $status = match ($o->status) {
                    'lunas' => 'lunas',
                    'menunggu', 'menunggu_verifikasi' => 'menunggu',
                    default => 'gagal',
                };
                $m = strtolower((string) $o->payment_method);
                $rows->push([
                    'at' => Carbon::parse($o->paid_at ?? $o->created_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('Y-m-d H:i'),
                    'code' => $o->code,
                    'type' => 'tiket',
                    'dir' => 'masuk',
                    'title' => $ev?->title ?? '-',
                    'subtitle' => $o->buyer_name,
                    'method' => ($m !== '' && (str_contains($m, 'manual') || str_contains($m, 'transfer'))) ? 'manual' : 'online',
                    'status' => $status,
                    'amount' => (int) $o->total,
                    'fee' => (int) $o->fee,
                ]);
            }
        }

        // Paket event
        if ($wantPaket) {
            foreach ($events as $e) {
                if ($e->parent_id !== null || $e->payment_status === null) {
                    continue;
                }
                $snap = $e->package_snapshot ?? [];
                $amt = (int) ($snap['estimated_upfront'] ?? 0);
                if ($amt <= 0) {
                    continue;
                }
                $rows->push([
                    'at' => Carbon::parse($e->payment_reviewed_at ?? $e->updated_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('Y-m-d H:i'),
                    'code' => 'PKT-'.$e->id,
                    'type' => 'paket',
                    'dir' => 'masuk',
                    'title' => $e->title,
                    'subtitle' => ($e->institution?->name ?? '-').' · '.($snap['name'] ?? '-'),
                    'method' => (($snap['payment_method'] ?? null) === 'transfer_manual') ? 'manual' : 'online',
                    'status' => match ($e->payment_status) {
                        'lunas' => 'lunas',
                        'menunggu_verifikasi', 'menunggu_pembayaran' => 'menunggu',
                        'dikembalikan' => 'dikembalikan',
                        default => 'gagal',
                    },
                    'amount' => $amt,
                    'fee' => 0,
                ]);
            }
        }

        // Vote (Midtrans / manual)
        if ($wantVote) {
            $votes = $inRange(
                DB::table('voting_orders')->select(['id', 'event_id', 'code', 'buyer_name', 'votes', 'amount', 'service_fee', 'status', 'payment_proof', 'midtrans_order_id', 'paid_at', 'created_at']),
                'DATE(COALESCE(paid_at, created_at))'
            );
            foreach ($votes->cursor() as $o) {
                $ev = $events[$o->event_id] ?? null;
                $rows->push([
                    'at' => Carbon::parse($o->paid_at ?? $o->created_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('Y-m-d H:i'),
                    'code' => $o->code,
                    'type' => 'vote',
                    'dir' => 'masuk',
                    'title' => $ev?->title ?? '-',
                    'subtitle' => $o->buyer_name.' · '.number_format((int) $o->votes, 0, ',', '.').' vote',
                    'method' => $o->midtrans_order_id ? 'online' : 'manual',
                    'status' => match ($o->status) {
                        'lunas' => 'lunas',
                        'menunggu', 'menunggu_verifikasi' => 'menunggu',
                        default => 'gagal',
                    },
                    'amount' => (int) $o->amount,
                    'fee' => (int) $o->service_fee,
                ]);
            }
        }

        // Penarikan dana
        if ($wantTarik) {
            $withdrawals = $inRange(
                DB::table('withdrawals')->select(['id', 'event_id', 'amount', 'bank_name', 'status', 'transferred_at', 'created_at']),
                'DATE(COALESCE(transferred_at, created_at))'
            );
            foreach ($withdrawals->cursor() as $w) {
                $ev = $events[$w->event_id] ?? null;
                $rows->push([
                    'at' => Carbon::parse($w->transferred_at ?? $w->created_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('Y-m-d H:i'),
                    'code' => 'WD-'.$w->id,
                    'type' => 'penarikan',
                    'dir' => 'keluar',
                    'title' => $ev?->title ?? '-',
                    'subtitle' => ($ev?->institution?->name ?? '-').' · '.$w->bank_name,
                    'method' => 'manual',
                    'status' => match ($w->status) {
                        'ditransfer' => 'lunas',
                        'menunggu', 'disetujui' => 'menunggu',
                        default => 'gagal',
                    },
                    'amount' => (int) $w->amount,
                    'fee' => 0,
                ]);
            }
        }

        $q = mb_strtolower($f['q']);
        $rows = $rows->filter(function ($r) use ($f, $q) {
            $d = substr($r['at'], 0, 10);
            if ($f['range'] !== 'semua') {
                if ($f['from'] !== '' && $d < $f['from']) return false;
                if ($f['to'] !== '' && $d > $f['to']) return false;
            }
            if ($f['type'] !== 'semua' && $r['type'] !== $f['type']) return false;
            if ($f['dir'] !== 'semua' && $r['dir'] !== $f['dir']) return false;
            if ($f['method'] !== 'semua' && $r['method'] !== $f['method']) return false;
            if ($q !== '' && ! str_contains(mb_strtolower($r['code'].' '.$r['title'].' '.$r['subtitle']), $q)) return false;

            return true;
        })->sortByDesc('at')->values();

        // Ringkasan: hanya transaksi lunas, mengikuti semua filter kecuali status
        $paid = $rows->where('status', 'lunas');
        $masuk = $paid->where('dir', 'masuk');
        $keluar = $paid->where('dir', 'keluar');
        $summary = [
            'masuk' => (int) $masuk->sum('amount'),
            'masuk_count' => $masuk->count(),
            'keluar' => (int) $keluar->sum('amount'),
            'keluar_count' => $keluar->count(),
            'selisih' => (int) ($masuk->sum('amount') - $keluar->sum('amount')),
            'fee' => (int) $masuk->sum('fee'),
        ];

        if ($f['status'] !== 'semua') {
            $rows = $rows->where('status', $f['status'])->values();
        }

        return [$rows, $summary, $f];
    }
}
