<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MyActivityController extends Controller
{
    /** Status pendaftaran yang boleh melihat hasil. */
    private const RESULT_STATUS = ['terdaftar'];

    /** Tautan halaman tiket (sesuaikan dengan route aslinya). */
    private const TICKET_URL = '/tiket-saya';

    private function resultsMode(int $eventId): string
    {
        $v = DB::table('judging_event_publication')->where('event_id', $eventId)->value('visibility');

        return in_array($v, ['own', 'all'], true) ? $v : 'hidden';
    }

    public function hasil(Request $request, int $registration)
    {
        $u = $request->user();
        $r = DB::table('event_registrations')->where('id', $registration)
            ->where(function ($q) use ($u) {
                $q->where('user_id', $u->id);
                if ($u->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(contact_email)) = ?', [mb_strtolower(trim($u->email))]);
                }
            })->first();
        abort_unless($r && in_array($r->status, self::RESULT_STATUS, true), 404);

        $eventId = (int) $r->event_id;
        $mode = $this->resultsMode($eventId);
        $rows = [];
        if ($mode !== 'hidden') {
            $cat = (int) ($r->participant_category_id ?? 0);
            $codes = collect(\App\Support\Judging::participants($eventId, $cat))->pluck('code', 'id');
            $pos = 0;
            $prev = null;
            $place = null;
            foreach (\App\Support\Judging::ranking($eventId, $cat) as $i => $row) {
                if ($row['final'] === null) {
                    $place = null;
                } else {
                    if ($row['final'] !== $prev) {
                        $pos = $i + 1;
                        $prev = $row['final'];
                    }
                    $place = $pos;
                }
                $mine = (int) $row['id'] === (int) $r->id;
                if ($mode === 'own' && ! $mine) {
                    continue;
                }
                $rows[] = ['rank' => $place, 'code' => (string) ($codes[$row['id']] ?? '-'), 'final' => $row['final'], 'mine' => $mine];
            }
        }

        return Inertia::render('saya/hasil', [
            'event_title' => (string) DB::table('events')->where('id', $eventId)->value('title'),
            'mode' => $mode,
            'rows' => $rows,
        ]);
    }

    /** Aturan penilaian yang sudah dikirim panitia untuk akun ini (pendaftar formulir dan pemegang tiket). */
    private function ruleSets($u, int $eventId): array
    {
        $mail = $u->email_verified_at ? mb_strtolower(trim($u->email)) : null;
        $cats = collect(\App\Support\Judging::categories($eventId));
        $first = (int) ($cats->first()['id'] ?? 0);
        $mine = [];

        $regs = DB::table('event_registrations')->where('event_id', $eventId)
            ->whereNotIn('status', ['ditolak', 'batal', 'dibatalkan', 'kedaluwarsa'])
            ->where(function ($q) use ($u, $mail) {
                $q->where('user_id', $u->id);
                if ($mail) {
                    $q->orWhereRaw('LOWER(TRIM(contact_email)) = ?', [$mail]);
                }
            })->get(['participant_category_id']);
        foreach ($regs as $r) {
            $mine[] = (int) ($r->participant_category_id ?: $first);
        }

        $held = DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->leftJoin('ticket_types as t', 't.id', '=', 'h.ticket_type_id')
            ->where('h.event_id', $eventId)->where('o.status', 'lunas')
            ->where(fn ($q) => $q->where('t.audience', 'peserta')->orWhereNull('t.audience'))
            ->where(function ($q) use ($u, $mail) {
                $q->where('o.user_id', $u->id);
                if ($mail) {
                    $q->orWhereRaw('LOWER(TRIM(o.buyer_email)) = ?', [$mail]);
                }
            })->pluck('t.participant_category_id');
        foreach ($held as $c) {
            $mine[] = (int) ($c ?: $first);
        }

        $out = [];
        foreach (array_values(array_unique($mine)) as $cid) {
            $sent = DB::table('judging_publication_settings')->where('event_id', $eventId)->where('category_id', $cid)->value('rules_sent');
            if (! $sent) {
                continue;
            }
            $p = DB::table('judging_publications')->where('event_id', $eventId)->where('category_id', $cid)->orderByDesc('number')->first();
            if (! $p) {
                continue;
            }
            $out[] = [
                'category' => count($cats) > 1 ? (string) ($cats->firstWhere('id', $cid)['name'] ?? '') : '',
                'version' => (int) $p->number,
                'note' => $p->note,
                'sent_at' => $p->created_at ? Carbon::parse($p->created_at)->toDateString() : null,
                'rules' => json_decode((string) $p->rules, true) ?: [],
            ];
        }

        return $out;
    }

    private function rulesUrl($u, int $eventId): ?string
    {
        return $this->ruleSets($u, $eventId) ? "/event-saya/{$eventId}/aturan" : null;
    }

    public function aturan(Request $request, int $event)
    {
        $sets = $this->ruleSets($request->user(), $event);
        abort_if(! $sets, 404);

        return Inertia::render('saya/aturan', [
            'event_title' => (string) DB::table('events')->where('id', $event)->value('title'),
            'sets' => $sets,
        ]);
    }

    private function eventData($e): array
    {
        return [
            'title' => $e?->title,
            'category' => $e?->category,
            'location' => $e?->location,
            'starts_at' => $e?->starts_at ? Carbon::parse($e->starts_at)->toDateString() : null,
            'poster' => $e?->poster_path ? '/storage/' . ltrim($e->poster_path, '/') : null,
        ];
    }

    public function lomba(Request $request)
    {
        $u = $request->user();
        $match = function ($q, string $emailCol) use ($u) {
            $q->where('user_id', $u->id);
            if ($u->email_verified_at) {
                $q->orWhereRaw("LOWER(TRIM($emailCol)) = ?", [mb_strtolower(trim($u->email))]);
            }
        };

        $regs = EventRegistration::with('event')
            ->where(fn ($q) => $match($q, 'contact_email'))
            ->latest()->get();

        $rows = $regs->map(fn ($r) => [
            'id' => $r->id,
            'key' => 'f' . $r->id,
            'status' => $r->status,
            'ticket_url' => null,
            'can_results' => in_array($r->status, self::RESULT_STATUS, true) && $this->resultsMode((int) $r->event_id) !== 'hidden',
            'rules_url' => $this->rulesUrl($u, (int) $r->event_id),
        ] + \App\Support\StatusPeserta::transfer($r->status) + $this->eventData($r->event))->all();

        // Event yang diikuti lewat tiket lunas (satu baris per event, lewati yang sudah ada dari formulir)
        $orders = DB::table('ticket_orders')
            ->where(fn ($q) => $match($q, 'buyer_email'))
            ->latest('id')->get()
            ->sortBy(fn ($o) => $o->status === 'lunas' ? 0 : 1)
            ->unique('event_id')
            ->reject(fn ($o) => $regs->contains('event_id', $o->event_id));
        $events = \App\Models\Event::whereIn('id', $orders->pluck('event_id'))->get()->keyBy('id');

        foreach ($orders as $o) {
            $rows[] = [
                'id' => 0,
                'key' => 't' . $o->id,
                'status' => $o->status,
                'ticket_url' => self::TICKET_URL,
                'can_results' => false,
                'rules_url' => $this->rulesUrl($u, (int) $o->event_id),
            ] + \App\Support\StatusPeserta::tiket($o->status, $o->rejected_at ?? null, $o->expires_at ?? null)
              + $this->eventData($events->get($o->event_id));
        }

        return Inertia::render('saya/lomba', ['rows' => $rows]);
    }

    public function tiket(Request $request)
    {
        $orders = \Illuminate\Support\Facades\DB::table('ticket_orders')
            ->where('status', 'lunas')->where(function ($q) use ($request) {
                $u = $request->user();
                $q->where('user_id', $u->id);
                if ($u->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(buyer_email)) = ?', [mb_strtolower(trim($u->email))]);
                }
            })
            ->latest('id')->get();
        $holders = \Illuminate\Support\Facades\DB::table('ticket_holders')
            ->whereIn('ticket_order_id', $orders->pluck('id'))->orderBy('id')->get()
            ->groupBy('ticket_order_id');
        $events = \App\Models\Event::whereIn('id', $orders->pluck('event_id'))->get()->keyBy('id');

        $rows = $orders->map(fn ($o) => [
            'id' => $o->id,
            'code' => $o->code,
            'quantity' => (int) $o->quantity,
            'total_price' => (int) $o->total,
            'status' => $o->status,
            'tickets' => $holders->get($o->id, collect())->map(fn ($h) => [
                'code' => $h->code,
                'holder_name' => $h->holder_name,
                'checked_in' => $h->checked_in_at !== null,
            ])->values()->all(),
        ] + \App\Support\StatusPeserta::tiket($o->status, $o->rejected_at ?? null, $o->expires_at ?? null)
          + $this->eventData($events->get($o->event_id)))->values()->all();

        $u = $request->user();
        $waiting = DB::table('ticket_orders')
            ->where('payment_method', '!=', 'midtrans')
            ->where(fn ($q) => $q->where('status', 'menunggu_verifikasi')->orWhere(fn ($w) => $w->where('status', 'batal')->whereNotNull('rejected_at')))
            ->where(function ($q) use ($u) {
                $q->where('user_id', $u->id);
                if ($u->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(buyer_email)) = ?', [mb_strtolower(trim($u->email))]);
                }
            })
            ->latest('id')->get();
        $titles = DB::table('events')->whereIn('id', $waiting->pluck('event_id'))->pluck('title', 'id');
        $pending = $waiting->groupBy(fn ($o) => $o->group_code ?: 'o'.$o->id)->map(function ($g) use ($titles) {
            $o = $g->first();

            return [
                'code' => $o->code,
                'title' => ($titles[$o->event_id] ?? null).($g->count() > 1 ? ' (+'.($g->count() - 1).' kegiatan)' : ''),
                'quantity' => (int) $o->quantity,
                'total' => (int) $g->sum('total'),
                'status' => $o->status === 'batal' ? 'ditolak' : 'menunggu_verifikasi',
                'reason' => $o->reject_reason,
                'created_at' => Carbon::parse($o->created_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->locale('id')->translatedFormat('j M Y, H:i'),
            ];
        })->values()->all();

        return Inertia::render('saya/tiket', ['rows' => $rows, 'pending' => $pending]);
    }
}
