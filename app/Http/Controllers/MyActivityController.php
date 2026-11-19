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
        $rows = EventRegistration::with('event')
            ->where(function ($q) use ($request) {
                $u = $request->user();
                $q->where('user_id', $u->id);
                if ($u->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(contact_email)) = ?', [mb_strtolower(trim($u->email))]);
                }
            })->latest()->get()
            ->map(fn ($r) => ['id' => $r->id, 'status' => $r->status, 'can_results' => in_array($r->status, self::RESULT_STATUS, true) && $this->resultsMode((int) $r->event_id) !== 'hidden'] + $this->eventData($r->event))
            ->all();

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
        ] + $this->eventData($events->get($o->event_id)))->values()->all();

        return Inertia::render('saya/tiket', ['rows' => $rows]);
    }
}
