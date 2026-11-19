<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Support\ImageUploader;
use App\Support\Revenue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RevenueController extends Controller
{
    private const STATUSES = ['menunggu', 'disetujui', 'ditransfer', 'ditolak'];

    public function index(Request $request): Response
    {
        $tab = $request->query('tab') === 'saldo' ? 'saldo' : 'penarikan';
        $status = (string) $request->query('status', 'menunggu');
        $status = in_array($status, [...self::STATUSES, 'all'], true) ? $status : 'menunggu';
        $q = trim((string) $request->query('q', ''));

        $page = $this->query($status, $q)->paginate(10)->withQueryString();
        $items = $page->getCollection()->map(fn (Withdrawal $w) => $this->present($w))->values();

        $by = Withdrawal::selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');
        $counts = ['all' => (int) $by->sum()];
        foreach (self::STATUSES as $s) {
            $counts[$s] = (int) ($by[$s] ?? 0);
        }

        $report = Revenue::report();
        $balances = $report['balances']->when($q !== '', fn ($c) => $c->filter(
            fn ($b) => stripos($b['title'].' '.$b['institution'], $q) !== false
        ))->values();

        return Inertia::render('admin/pendapatan', [
            'tab' => $tab,
            'status' => $status,
            'q' => $q,
            'withdrawals' => $items,
            'counts' => $counts,
            'summary' => $report['summary'],
            'balances' => $balances,
            'pg' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'from' => $page->firstItem(),
                'to' => $page->lastItem(),
            ],
        ]);
    }

    public function csv(Request $request)
    {
        $status = (string) $request->query('status', 'all');
        $status = in_array($status, [...self::STATUSES, 'all'], true) ? $status : 'all';
        $q = trim((string) $request->query('q', ''));
        $rows = $this->query($status, $q)->get();

        $safe = fn ($v) => is_string($v) && $v !== '' && in_array($v[0], ['=', '+', '-', '@'], true) ? "'".$v : $v;

        return response()->streamDownload(function () use ($rows, $safe) {
            $o = fopen('php://output', 'w');
            fwrite($o, "\xEF\xBB\xBF");
            fputcsv($o, ['Tanggal', 'Lembaga', 'Event', 'Bank', 'No. Rekening', 'Atas Nama', 'Nominal', 'Status', 'Alasan', 'Tgl Transfer']);
            foreach ($rows as $w) {
                fputcsv($o, [
                    $w->created_at?->format('Y-m-d H:i'),
                    $safe($w->institution?->name ?? '-'),
                    $safe($w->event?->title ?? '-'),
                    $safe($w->bank_name),
                    $safe($w->account_number),
                    $safe($w->account_name),
                    $w->amount,
                    $w->status,
                    $safe((string) $w->reject_reason),
                    $w->transferred_at?->format('Y-m-d H:i'),
                ]);
            }
            fclose($o);
        }, 'penarikan-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function print(): Response
    {
        $report = Revenue::report();

        return Inertia::render('admin/pendapatan-cetak', [
            'summary' => $report['summary'],
            'balances' => $report['balances'],
            'withdrawals' => $this->query('all', '')->limit(500)->get()->map(fn (Withdrawal $w) => $this->present($w))->values(),
            'printed_at' => now()->locale('id')->translatedFormat('j F Y, H:i'),
        ]);
    }

    public function approve(Withdrawal $withdrawal): RedirectResponse
    {
        Withdrawal::where('id', $withdrawal->id)->where('status', Withdrawal::MENUNGGU)->update([
            'status' => Withdrawal::DISETUJUI,
            'approved_at' => now(),
            'reject_reason' => null,
        ]);

        return back()->with('success', 'Penarikan disetujui. Lanjutkan dengan mengunggah bukti transfer.');
    }

    public function reject(Request $request, Withdrawal $withdrawal): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:300']], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        Withdrawal::where('id', $withdrawal->id)->whereIn('status', [Withdrawal::MENUNGGU, Withdrawal::DISETUJUI])->update([
            'status' => Withdrawal::DITOLAK,
            'reject_reason' => $data['reason'],
        ]);

        return back()->with('success', 'Penarikan ditolak.');
    }

    public function transfer(Request $request, Withdrawal $withdrawal): RedirectResponse
    {
        if ($withdrawal->status !== Withdrawal::DISETUJUI) {
            return back()->withErrors(['proof' => 'Status permintaan sudah berubah. Muat ulang halaman.']);
        }

        $request->validate([
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:30720'],
        ], [
            'proof.required' => 'Unggah bukti transfer.',
            'proof.mimes' => 'Bukti harus JPG, PNG, WebP, atau PDF.',
            'proof.max' => 'Ukuran file terlalu besar (maksimal 30 MB).',
        ]);

        $path = ImageUploader::store($request->file('proof'), 'withdrawal-proofs', 'proof');

        $n = Withdrawal::where('id', $withdrawal->id)->where('status', Withdrawal::DISETUJUI)->update([
            'status' => Withdrawal::DITRANSFER,
            'transfer_proof' => $path,
            'transferred_at' => now(),
        ]);

        if ($n !== 1) {
            Storage::disk('public')->delete($path);

            return back()->withErrors(['proof' => 'Status permintaan sudah berubah. Muat ulang halaman.']);
        }

        return back()->with('success', 'Bukti transfer diunggah. Penarikan ditandai sudah ditransfer.');
    }

    public function proof(Withdrawal $withdrawal)
    {
        $path = $withdrawal->transfer_proof;
        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    private function query(string $status, string $q)
    {
        return Withdrawal::with(['institution:id,name', 'event:id,title'])
            ->when($status !== 'all', fn ($w) => $w->where('status', $status))
            ->when($q !== '', fn ($w) => $w->where(function ($s) use ($q) {
                $s->where('bank_name', 'like', "%{$q}%")
                    ->orWhere('account_number', 'like', "%{$q}%")
                    ->orWhere('account_name', 'like', "%{$q}%")
                    ->orWhereHas('institution', fn ($i) => $i->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('event', fn ($e) => $e->where('title', 'like', "%{$q}%"));
            }))
            ->latest('id');
    }

    private function present(Withdrawal $w): array
    {
        $fmt = fn ($d) => $d ? $d->copy()->locale('id')->translatedFormat('j M Y, H:i') : null;

        return [
            'id' => $w->id,
            'institution' => $w->institution?->name ?? '-',
            'event' => $w->event?->title ?? '-',
            'amount' => (int) $w->amount,
            'bank_name' => $w->bank_name,
            'account_number' => $w->account_number,
            'account_name' => $w->account_name,
            'status' => $w->status,
            'reject_reason' => $w->reject_reason,
            'proof' => $w->transfer_proof ? [
                'url' => route('admin.penarikan.bukti', $w->id),
                'is_pdf' => str_ends_with(strtolower($w->transfer_proof), '.pdf'),
            ] : null,
            'requested_at' => $fmt($w->created_at),
            'transferred_at' => $fmt($w->transferred_at),
        ];
    }
}
