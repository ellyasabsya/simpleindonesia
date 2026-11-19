<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PackagePaymentController extends Controller
{
    private const STATUSES = ['menunggu_verifikasi', 'lunas', 'ditolak', 'dikembalikan'];

    public function index(Request $request): Response
    {
        $status = (string) $request->query('status', 'menunggu_verifikasi');
        $status = in_array($status, [...self::STATUSES, 'all'], true) ? $status : 'menunggu_verifikasi';
        $q = trim((string) $request->query('q', ''));

        $base = fn () => Event::whereNull('parent_id')->whereNotNull('payment_status');

        $page = $base()->with('institution:id,name,email')
            ->when($status !== 'all', fn ($w) => $w->where('payment_status', $status))
            ->when($q !== '', fn ($w) => $w->where(function ($s) use ($q) {
                $s->where('title', 'like', "%{$q}%")
                    ->orWhereHas('institution', fn ($i) => $i->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
            }))
            ->latest()->latest('id')
            ->paginate(10)->withQueryString();

        $orders = $page->getCollection()->map(function (Event $e) {
            $snap = $e->package_snapshot ?? [];
            $opt = $snap['options'] ?? [];
            $proof = $snap['payment_proof'] ?? null;

            return [
                'id' => $e->id,
                'title' => $e->title,
                'institution' => $e->institution?->name ?? '-',
                'institution_email' => $e->institution?->email ?? '',
                'package' => $snap['name'] ?? '-',
                'detail' => implode(' · ', array_values(array_filter([
                    ($opt['sub_events'] ?? 0) > 0 ? $opt['sub_events'].' kegiatan' : null,
                    (! empty($opt['assessment_addon']) || ! empty($opt['judge_addon'])) ? 'Add-on penilaian juri' : null,
                ]))),
                'total' => (int) ($snap['estimated_upfront'] ?? 0),
                'status' => $e->payment_status,
                'note' => $e->payment_note,
                'proof' => $proof ? [
                    'url' => route('admin.verifikasi-paket.bukti', $e->id),
                    'is_pdf' => str_ends_with(strtolower($proof), '.pdf'),
                ] : null,
                'created_at' => $e->created_at?->format('d/m/Y H:i'),
            ];
        })->values();

        $counts = [];
        foreach (self::STATUSES as $s) {
            $counts[$s] = $base()->where('payment_status', $s)->count();
        }

        return Inertia::render('admin/verifikasi-paket', [
            'orders' => $orders,
            'status' => $status,
            'q' => $q,
            'manual_on' => \App\Models\Setting::manualOn(),
            'counts' => $counts,
            'pg' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'from' => $page->firstItem(),
                'to' => $page->lastItem(),
            ],
        ]);
    }

    public function proof(Event $event)
    {
        $path = $event->package_snapshot['payment_proof'] ?? null;
        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    public function approve(Event $event): RedirectResponse
    {
        DB::transaction(function () use ($event) {
            $n = Event::where('id', $event->id)->where('payment_status', 'menunggu_verifikasi')->update([
                'payment_status' => 'lunas',
                'payment_note' => null,
                'payment_reviewed_at' => now(),
            ]);

            if ($n === 1) {
                // Event utama dan semua kegiatan di dalamnya ditayangkan sekaligus
                Event::where(fn ($q) => $q->where('id', $event->id)->orWhere('parent_id', $event->id))->update([
                    'status' => Event::PUBLISHED,
                    'rejection_reason' => null,
                    'reviewed_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Pembayaran disetujui dan event sudah tayang.');
    }

    public function reject(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:300']], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        DB::transaction(function () use ($event, $data) {
            $n = Event::where('id', $event->id)->where('payment_status', 'menunggu_verifikasi')->update([
                'payment_status' => 'ditolak',
                'payment_note' => $data['reason'],
                'payment_reviewed_at' => now(),
            ]);

            if ($n === 1) {
                Event::where(fn ($q) => $q->where('id', $event->id)->orWhere('parent_id', $event->id))->update([
                    'status' => Event::REJECTED,
                    'rejection_reason' => 'Pembayaran ditolak: '.$data['reason'],
                    'reviewed_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Pembayaran ditolak dan event ikut ditolak.');
    }
}
