<?php

namespace App\Http\Controllers\Panel;

use App\Models\Certificate;
use App\Models\CertificateEvent;
use App\Models\CertificateRecipient;
use App\Models\Event;
use App\Support\CertificateCategories;
use App\Support\Judging;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

/**
 * Sertifikat Digital (Tahap 3): statistik, daftar penerima, riwayat. Hanya membaca.
 * Penerbitan, desain, PDF, notifikasi dan verifikasi menyusul di tahap berikutnya.
 */
class CertificateController extends EventScopedController
{
    private const APPROVED = ['terdaftar'];

    private const PER_PAGE = 25;

    public function index(Request $request, Event $event): Response
    {
        $this->guard($request, $event);

        $category = (string) $request->query('kategori', 'peserta');
        if (! CertificateCategories::valid($category)) {
            $category = 'peserta';
        }
        $search = trim((string) $request->query('cari', ''));

        $issued = Certificate::where('event_id', $event->id)
            ->orderByDesc('revision')
            ->get(['id', 'category', 'recipient_key', 'status', 'revision', 'certificate_number', 'issued_at', 'revoked_at'])
            ->unique(fn ($c) => $c->category.'|'.$c->recipient_key)
            ->keyBy(fn ($c) => $c->category.'|'.$c->recipient_key);

        $all = $this->recipients($event);

        // Statistik per kategori
        $counts = [];
        foreach (CertificateCategories::keys() as $key) {
            $rows = $all->where('category', $key);
            $statuses = $rows->map(fn ($r) => $issued->get($key.'|'.$r['key'])?->status ?? 'belum');
            $counts[] = [
                'key' => $key,
                'label' => CertificateCategories::label($key),
                'total' => $rows->count(),
                'issued' => $statuses->filter(fn ($s) => $s === Certificate::ISSUED)->count(),
                'revoked' => $statuses->filter(fn ($s) => $s === Certificate::REVOKED)->count(),
                'manual' => in_array($key, CertificateCategories::MANUAL, true),
            ];
        }

        $stats = [
            'recipients' => $all->count(),
            'issued' => $issued->where('status', Certificate::ISSUED)->count(),
            'pending' => $issued->whereIn('status', [Certificate::PENDING, Certificate::FAILED])->count(),
            'revoked' => $issued->where('status', Certificate::REVOKED)->count(),
        ];
        $stats['waiting'] = max(0, $stats['recipients'] - $issued->count());

        // Daftar penerima kategori terpilih (cari + halaman)
        $rows = $all->where('category', $category)
            ->when($search !== '', fn (Collection $c) => $c->filter(
                fn ($r) => str_contains(mb_strtolower($r['name'].' '.$r['code']), mb_strtolower($search))
            ))
            ->sortBy(fn ($r) => mb_strtolower($r['name']))
            ->values();

        $page = max(1, (int) $request->query('halaman', 1));
        $pages = max(1, (int) ceil($rows->count() / self::PER_PAGE));
        $page = min($page, $pages);

        $list = $rows->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values()->map(function ($r) use ($issued, $category) {
            $c = $issued->get($category.'|'.$r['key']);

            return [
                'key' => $r['key'],
                'name' => $r['name'],
                'code' => $r['code'],
                'source' => $r['source'],
                'status' => $c?->status ?? 'belum',
                'number' => $c?->certificate_number,
                'issued_at' => $c?->issued_at?->toIso8601String(),
            ];
        })->all();

        $history = CertificateEvent::query()
            ->leftJoin('certificates as c', 'c.id', '=', 'certificate_events.certificate_id')
            ->where('certificate_events.event_id', $event->id)
            ->orderByDesc('certificate_events.id')
            ->limit(30)
            ->get(['certificate_events.action', 'certificate_events.created_at', 'c.recipient_name', 'c.category', 'c.certificate_number'])
            ->map(fn ($h) => [
                'action' => $h->action,
                'at' => $h->created_at?->toIso8601String(),
                'name' => $h->recipient_name ?? '-',
                'category' => $h->category ? CertificateCategories::label((string) $h->category) : '-',
                'number' => $h->certificate_number,
            ])->all();

        return $this->render('panel/events/certificates', $event, [
            'stats' => $stats,
            'categories' => $counts,
            'active' => $category,
            'search' => $search,
            'recipients' => $list,
            'paging' => ['page' => $page, 'pages' => $pages, 'total' => $rows->count()],
            'history' => $history,
        ]);
    }

    /** Halaman "Sertifikat Saya" sementara (diganti penuh di Tahap 7): hanya milik akun yang masuk. */
    public function mine(Request $request)
    {
        $items = Certificate::where('user_id', $request->user()->id)
            ->where('status', Certificate::ISSUED)
            ->with('event:id,title')
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn ($c) => [
                'event' => $c->event?->title ?? '-',
                'label' => 'Sertifikat '.$c->categoryLabel(),
                'name' => $c->recipient_name,
                'url' => null,
            ])->all();

        return view('certificates.mine', ['items' => $items]);
    }

    /* ---------------------------------------------------------------- guard */

    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        abort_if($event->parent_id, 404);
        abort_unless(
            $event->status === Event::PUBLISHED && in_array('sertifikat', $event->menus(), true),
            403,
            'Fitur ini tidak termasuk dalam paket event Anda.'
        );
    }

    /* ------------------------------------------------------------- penerima */

    /**
     * Semua calon penerima event (induk + sub-event) dengan kunci stabil.
     * Bentuk: ['category','key','name','code','source'].
     */
    private function recipients(Event $event): Collection
    {
        $ids = array_merge([$event->id], $event->children()->pluck('id')->all());

        return $this->participants($ids)
            ->concat($this->judges($ids))
            ->concat($this->winners($ids))
            ->concat($this->manual($event))
            ->unique(fn ($r) => $r['category'].'|'.$r['key'])
            ->values();
    }

    private function participants(array $ids): Collection
    {
        $tickets = DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->whereIn('h.event_id', $ids)
            ->where('o.status', 'lunas')
            ->whereNotNull('h.reg_code')
            ->orderBy('h.id')
            ->get(['h.reg_code', 'h.holder_name'])
            ->map(fn ($h) => [
                'category' => 'peserta',
                'key' => 'ticket:'.$h->reg_code,
                'name' => $h->holder_name ?: '-',
                'code' => (string) $h->reg_code,
                'source' => 'Tiket',
            ]);

        $regs = DB::table('event_registrations')
            ->whereIn('event_id', $ids)
            ->whereNotNull('reg_code')
            ->orderBy('id')
            ->get()
            ->filter(fn ($r) => in_array(mb_strtolower((string) $r->status), self::APPROVED, true));

        $users = DB::table('users')->whereIn('id', $regs->pluck('user_id')->filter()->all())->pluck('name', 'id');

        return $tickets->concat($regs->map(fn ($r) => [
            'category' => 'peserta',
            'key' => 'reg:'.$r->reg_code,
            'name' => $r->contact_name ?: ($users[$r->user_id] ?? '-'),
            'code' => (string) $r->reg_code,
            'source' => 'Pendaftaran',
        ]));
    }

    private function judges(array $ids): Collection
    {
        return DB::table('judges')->whereIn('event_id', $ids)->orderBy('id')->get()->map(fn ($j) => [
            'category' => 'juri',
            'key' => 'judge:'.$j->id,
            'name' => data_get($j, 'name') ?: 'Juri '.$j->id,
            'code' => 'JURI-'.str_pad((string) $j->id, 4, '0', STR_PAD_LEFT),
            'source' => 'Juri',
        ]);
    }

    /** Juara 1-3 dibaca dari sistem penilaian yang sudah ada (hanya setelah dikunci/final). */
    private function winners(array $ids): Collection
    {
        $out = collect();

        foreach ($ids as $eventId) {
            try {
                $final = DB::table('judging_overall')->where('event_id', $eventId)->whereNotNull('finalized_at')->exists();
                if (! $final) {
                    continue;
                }

                foreach (Judging::categories($eventId) as $cat) {
                    $names = collect(Judging::participants($eventId, (int) $cat['id']));
                    $ranking = Judging::ranking($eventId, (int) $cat['id']);
                    $place = 0;

                    foreach ($ranking as $row) {
                        if (++$place > 3) {
                            break;
                        }
                        $pid = data_get($row, 'id');
                        $p = $names->first(fn ($x) => (string) data_get($x, 'id') === (string) $pid);
                        $code = (string) (data_get($p, 'code') ?? data_get($row, 'code') ?? $pid);

                        $out->push([
                            'category' => 'juara_'.$place,
                            'key' => 'win:'.$eventId.':'.(int) $cat['id'].':'.$code,
                            'name' => (string) (data_get($p, 'name') ?? data_get($row, 'name') ?? '-'),
                            'code' => $code,
                            'source' => 'Juara · '.$cat['name'],
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                report($e); // skema penilaian berbeda: lewati, jangan menjatuhkan halaman
            }
        }

        return $out;
    }

    private function manual(Event $event): Collection
    {
        return CertificateRecipient::where('event_id', $event->id)->orderBy('id')->get()->map(fn ($m) => [
            'category' => (string) $m->category,
            'key' => 'manual:'.$m->id,
            'name' => (string) $m->name,
            'code' => 'MAN-'.str_pad((string) $m->id, 4, '0', STR_PAD_LEFT),
            'source' => 'Manual',
        ]);
    }
}
