<?php

namespace App\Http\Controllers\Panel;

use App\Jobs\GenerateCertificate;
use App\Models\Certificate;
use App\Models\CertificateBatch;
use App\Models\CertificateTemplate;
use App\Models\Event;
use App\Models\Institution;
use App\Support\CertificateCategories;
use App\Support\CertificateIssuer;
use App\Support\CertificateRecipients;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Response;

/**
 * Penerbitan sertifikat (Tahap 5): mulai batch, pantau progres, unduh PDF milik event ini.
 * Pekerjaan berat dikerjakan oleh job GenerateCertificate di antrean.
 */
class CertificateIssueController extends EventScopedController
{
    private function guard(Request $request, Event $event): Institution
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        abort_if($event->parent_id, 404);
        abort_unless(
            $event->status === Event::PUBLISHED && in_array('sertifikat', $event->menus(), true),
            403,
            'Fitur ini tidak termasuk dalam paket event Anda.'
        );

        return $inst;
    }

    private function templates(Institution $inst, Event $event)
    {
        return CertificateTemplate::where('institution_id', $inst->id)
            ->where(fn ($q) => $q->whereNull('event_id')->orWhere('event_id', $event->id));
    }

    private function batchOf(Event $event, int $id): CertificateBatch
    {
        return CertificateBatch::where('event_id', $event->id)->findOrFail($id);
    }

    private function presentBatch(CertificateBatch $b): array
    {
        return [
            'id' => $b->id,
            'category' => CertificateCategories::label((string) $b->category),
            'status' => $b->status,
            'total' => (int) $b->total,
            'done' => (int) $b->done,
            'failed' => (int) $b->failed,
            'created_at' => $b->created_at?->toIso8601String(),
            'finished_at' => $b->finished_at?->toIso8601String(),
        ];
    }

    /* ---------------------------------------------------------------- halaman */

    public function index(Request $request, Event $event): Response
    {
        $inst = $this->guard($request, $event);

        $issued = Certificate::where('event_id', $event->id)
            ->orderByDesc('revision')
            ->get(['id', 'category', 'recipient_key', 'status'])
            ->unique(fn ($c) => $c->category.'|'.$c->recipient_key)
            ->keyBy(fn ($c) => $c->category.'|'.$c->recipient_key);

        $all = CertificateRecipients::all($event);
        $categories = [];
        foreach (CertificateCategories::keys() as $key) {
            $rows = $all->where('category', $key);
            $st = $rows->map(fn ($r) => $issued->get($key.'|'.$r['key'])?->status ?? 'belum');
            $categories[] = [
                'key' => $key,
                'label' => CertificateCategories::label($key),
                'total' => $rows->count(),
                'issued' => $st->filter(fn ($s) => $s === Certificate::ISSUED)->count(),
                'revoked' => $st->filter(fn ($s) => $s === Certificate::REVOKED)->count(),
                'failed' => $st->filter(fn ($s) => $s === Certificate::FAILED)->count(),
                'waiting' => $st->filter(fn ($s) => ! in_array($s, [Certificate::ISSUED, Certificate::REVOKED], true))->count(),
            ];
        }

        $recent = Certificate::where('event_id', $event->id)->where('status', Certificate::ISSUED)
            ->orderByDesc('issued_at')->limit(15)
            ->get(['id', 'category', 'recipient_name', 'certificate_number', 'issued_at'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->recipient_name,
                'category' => CertificateCategories::label((string) $c->category),
                'number' => $c->certificate_number,
                'issued_at' => $c->issued_at?->toIso8601String(),
            ])->all();

        return $this->render('panel/events/certificate-issue', $event, [
            'eventId' => $event->id,
            'categories' => $categories,
            'templates' => $this->templates($inst, $event)->orderByDesc('id')->get(['id', 'name', 'orientation'])->all(),
            'batches' => CertificateBatch::where('event_id', $event->id)->orderByDesc('id')->limit(10)->get()
                ->map(fn ($b) => $this->presentBatch($b))->all(),
            'recent' => $recent,
            'queue' => (string) config('queue.default'),
        ]);
    }

    /* ----------------------------------------------------------------- mulai */

    public function start(Request $request, Event $event): RedirectResponse
    {
        $inst = $this->guard($request, $event);

        $data = $request->validate([
            'category' => ['required', 'string'],
            'template_id' => ['required', 'integer'],
        ], [
            'template_id.required' => 'Pilih template sertifikat.',
        ]);
        abort_unless(CertificateCategories::valid($data['category']), 422);

        $template = $this->templates($inst, $event)->with('signer')->find($data['template_id']);
        abort_unless($template, 404);

        // Satu batch aktif per kategori: cegah klik ganda dan penerbitan bersamaan.
        $lock = Cache::lock('cert-batch:'.$event->id.':'.$data['category'], 15);
        if (! $lock->get()) {
            return back()->withErrors(['category' => 'Penerbitan sedang dimulai, coba lagi sebentar.']);
        }

        try {
            $active = CertificateBatch::where('event_id', $event->id)->where('category', $data['category'])
                ->whereIn('status', ['queued', 'running'])->where('created_at', '>', now()->subHours(2))->exists();
            if ($active) {
                return back()->withErrors(['category' => 'Masih ada penerbitan berjalan untuk kategori ini.']);
            }

            $statuses = Certificate::where('event_id', $event->id)->where('category', $data['category'])
                ->orderByDesc('revision')->get(['recipient_key', 'status'])
                ->unique('recipient_key')->pluck('status', 'recipient_key');

            // Hanya yang belum terbit dan tidak dicabut. Yang gagal ikut diulang.
            $todo = CertificateRecipients::forCategory($event, $data['category'])
                ->filter(fn ($r) => ! in_array($statuses[$r['key']] ?? null, [Certificate::ISSUED, Certificate::REVOKED], true))
                ->sortBy(fn ($r) => mb_strtolower($r['name']))
                ->values();

            if ($todo->isEmpty()) {
                return back()->withErrors(['category' => 'Semua penerima kategori ini sudah memiliki sertifikat.']);
            }

            $batch = CertificateBatch::create([
                'event_id' => $event->id,
                'template_id' => $template->id,
                'category' => $data['category'],
                'status' => 'queued',
                'total' => $todo->count(),
                'done' => 0,
                'failed' => 0,
                'created_by' => $request->user()->id,
            ]);

            foreach ($todo as $r) {
                GenerateCertificate::dispatch($event->id, $template->id, $r, $batch->id, $request->user()->id);
            }
        } finally {
            $lock->release();
        }

        return back();
    }

    /* ---------------------------------------------------------------- progres */

    public function progress(Request $request, Event $event): JsonResponse
    {
        $this->guard($request, $event);

        $batches = CertificateBatch::where('event_id', $event->id)->orderByDesc('id')->limit(10)->get();
        foreach ($batches as $b) {
            if (in_array($b->status, ['queued', 'running'], true)) {
                CertificateIssuer::refreshBatch($b->id);
            }
        }

        return response()->json([
            'batches' => CertificateBatch::where('event_id', $event->id)->orderByDesc('id')->limit(10)->get()
                ->map(fn ($b) => $this->presentBatch($b))->all(),
        ]);
    }

    /* ----------------------------------------------------------------- unduh */

    public function file(Request $request, Event $event, int $certificate)
    {
        $this->guard($request, $event);

        $c = Certificate::where('event_id', $event->id)->where('status', Certificate::ISSUED)->findOrFail($certificate);
        abort_unless($c->pdf_path && Storage::disk(CertificateIssuer::DISK)->exists($c->pdf_path), 404);

        return Storage::disk(CertificateIssuer::DISK)->download(
            $c->pdf_path,
            'sertifikat-'.preg_replace('/[^A-Za-z0-9]+/', '-', $c->recipient_name).'-'.$c->id.'.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }
}
