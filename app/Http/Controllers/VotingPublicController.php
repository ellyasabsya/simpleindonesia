<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class VotingPublicController extends Controller
{
    private function open(Event $event): object
    {
        abort_unless($event->status === Event::PUBLISHED, 404);
        $s = DB::table('voting_settings')->where('event_id', $event->id)->first();
        abort_unless($s && $s->enabled, 404);

        return $s;
    }

    private function period(Event $event, object $s): array
    {
        $start = $s->vote_start ? Carbon::parse($s->vote_start)->startOfDay() : null;
        $end = $s->vote_end ? Carbon::parse($s->vote_end)->endOfDay() : $event->ends_at->copy()->endOfDay();

        return [$start, $end];
    }

    private function poster(Event $event): ?string
    {
        $cols = Schema::getColumnListing('events');
        foreach (['poster', 'poster_path', 'image', 'banner', 'cover', 'thumbnail', 'flyer'] as $c) {
            if (in_array($c, $cols, true) && $event->{$c}) {
                $v = (string) $event->{$c};

                return Str::startsWith($v, ['http', '/']) ? $v : '/storage/'.$v;
            }
        }

        return null;
    }

    private function state(Event $event, object $s): array
    {
        $parts = DB::table('voting_participants')->where('event_id', $event->id)->where('active', 1)->orderBy('sort')->orderBy('id')->get();
        $sum = DB::table('voting_orders')->where('event_id', $event->id)->where('status', 'lunas')
            ->selectRaw('participant_id, SUM(votes) as v')->groupBy('participant_id')->get()->pluck('v', 'participant_id');

        $list = $parts->map(fn ($p) => [
            'id' => (int) $p->id, 'name' => $p->name, 'description' => $p->description,
            'category_id' => $p->category_id ? (int) $p->category_id : null,
            'photo' => $p->photo ? '/storage/'.$p->photo : null,
            'votes' => (int) ($sum[$p->id] ?? 0),
        ])->all();

        if ($s->show_ranking) {
            usort($list, fn ($a, $b) => $b['votes'] <=> $a['votes']);
        }
        $total = array_sum(array_column($list, 'votes'));
        if (! $s->show_votes) {
            $list = array_map(fn ($r) => ['votes' => null] + $r, $list);
            $total = null;
        }

        $who = fn ($n) => $s->show_sender ? $n : 'Anonim';
        $feed = DB::table('voting_orders as o')->join('voting_participants as p', 'p.id', '=', 'o.participant_id')
            ->where('o.event_id', $event->id)->where('o.status', 'lunas')->orderByDesc('o.id')->limit(10)
            ->get(['o.id', 'o.buyer_name', 'o.votes', 'o.message', 'p.name as participant'])
            ->map(fn ($r) => [
                'id' => (int) $r->id, 'sender' => $who($r->buyer_name), 'participant' => $r->participant,
                'votes' => $s->show_votes ? (int) $r->votes : null,
                'message' => $s->message_enabled ? $r->message : null,
            ])->all();

        $supporters = [];
        if ($s->show_sender) {
            $supporters = DB::table('voting_orders')->where('event_id', $event->id)->where('status', 'lunas')
                ->selectRaw('MAX(buyer_name) as name, SUM(votes) as v, COUNT(*) as n')->groupByRaw('lower(buyer_email)')
                ->orderByRaw('SUM(votes) desc')->limit(5)->get()
                ->map(fn ($r) => ['name' => $r->name, 'votes' => $s->show_votes ? (int) $r->v : null, 'orders' => (int) $r->n])->all();
        }

        return ['participants' => $list, 'total' => $total, 'feed' => $feed, 'supporters' => $supporters];
    }

    public function index()
    {
        $settings = DB::table('voting_settings')->where('enabled', 1)->get()->keyBy('event_id');
        $events = $settings->isEmpty() ? collect() : Event::where('status', Event::PUBLISHED)
            ->whereIn('id', $settings->keys())->with('institution')->latest('id')->get();
        $ids = $events->pluck('id');

        $parts = DB::table('voting_participants')->whereIn('event_id', $ids)->where('active', 1)
            ->selectRaw('event_id, COUNT(*) as n')->groupBy('event_id')->pluck('n', 'event_id');
        $votes = DB::table('voting_orders')->whereIn('event_id', $ids)->where('status', 'lunas')
            ->selectRaw('event_id, SUM(votes) as v')->groupBy('event_id')->pluck('v', 'event_id');

        $labelsConst = '\\App\\Http\\Controllers\\Panel\\EventController::CATEGORIES';
        $labels = defined($labelsConst) ? constant($labelsConst) : [];
        $now = now();

        $items = $events->map(function (Event $e) use ($settings, $parts, $votes, $labels, $now) {
            $s = $settings[$e->id];
            [$start, $end] = $this->period($e, $s);

            if ($now->gt($end)) {
                $status = ['key' => 'tutup', 'label' => 'Ditutup'];
            } elseif ($start && $now->lt($start)) {
                $status = ['key' => 'segera', 'label' => $now->copy()->startOfDay()->diffInDays($start).' hari lagi'];
            } else {
                $status = ['key' => 'buka', 'label' => 'Buka'];
            }

            return [
                'id' => $e->id,
                'title' => $e->title,
                'poster' => $e->posterUrl() ?: $this->poster($e),
                'location' => $e->location,
                'organizer' => $e->institution?->name,
                'category_key' => $e->category ?: null,
                'category' => $e->category ? ($labels[$e->category] ?? ucfirst((string) $e->category)) : null,
                'ends' => $end->toDateString(),
                'participants' => (int) ($parts[$e->id] ?? 0),
                'votes' => $s->show_votes ? (int) ($votes[$e->id] ?? 0) : null,
                'price' => (int) $s->price_per_vote,
                'status' => $status,
            ];
        })->values();

        return Inertia::render('voting/index', ['items' => $items]);
    }

    public function show(Event $event)
    {
        $s = $this->open($event);
        [$start, $end] = $this->period($event, $s);
        $inst = Schema::hasColumn('institutions', 'name') ? DB::table('institutions')->where('id', $event->institution_id)->value('name') : null;

        return Inertia::render('voting/show', [
            'event' => [
                'id' => $event->id, 'title' => $event->title,
                'description' => Schema::hasColumn('events', 'description') ? $event->description : null,
                'location' => $event->location, 'date' => $event->starts_at->toIso8601String(),
                'organizer' => $inst, 'poster' => $this->poster($event),
            ],
            'period' => ['start' => $start?->toIso8601String(), 'end' => $end->toIso8601String()],
            'settings' => [
                'price' => (int) $s->price_per_vote, 'min_votes' => (int) $s->min_votes,
                'message_enabled' => (bool) $s->message_enabled, 'message_max' => (int) $s->message_max,
                'show_sender' => (bool) $s->show_sender, 'show_ranking' => (bool) $s->show_ranking, 'show_votes' => (bool) $s->show_votes,
            ],
            'categories' => DB::table('voting_categories')->where('event_id', $event->id)->orderBy('sort')->orderBy('id')->get(['id', 'name'])
                ->map(fn ($r) => ['id' => (int) $r->id, 'name' => $r->name])->all(),
            'gifts' => DB::table('voting_gifts')->where('event_id', $event->id)->where('active', 1)->orderBy('votes')->get(['id', 'emoji', 'name', 'votes', 'price'])
                ->map(fn ($r) => ['id' => (int) $r->id, 'emoji' => $r->emoji, 'name' => $r->name, 'votes' => (int) $r->votes, 'price' => (int) $r->price])->all(),
            'bank' => (array) \App\Models\Setting::bank(),
            'online' => (string) config('midtrans.server_key') !== '',
            'live' => $this->state($event, $s),
        ]);
    }

    public function data(Event $event)
    {
        return response()->json($this->state($event, $this->open($event)))->header('Cache-Control', 'no-store');
    }

    public function buy(Request $request, Event $event): RedirectResponse
    {
        abort_unless((string) config('midtrans.server_key') !== '', 503);
        $s = $this->open($event);
        [$start, $end] = $this->period($event, $s);
        if (($start && now()->lt($start)) || now()->gt($end)) {
            throw ValidationException::withMessages(['participant_id' => 'Voting sedang tidak dibuka.']);
        }

        $data = $request->validate([
            'participant_id' => ['required', 'integer'],
            'gift_id' => ['nullable', 'integer'],
            'votes' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'buyer_name' => ['required', 'string', 'max:80'],
            'buyer_email' => ['required', 'email:rfc,dns', 'max:120'],
            'message' => ['nullable', 'string', 'max:200'],
        ], [
            'required' => ':attribute wajib diisi.', 'email' => 'Format email tidak valid.',
        ], ['participant_id' => 'Peserta', 'buyer_name' => 'Nama', 'buyer_email' => 'Email']);

        abort_unless(DB::table('voting_participants')->where('id', $data['participant_id'])->where('event_id', $event->id)->where('active', 1)->exists(), 422);

        if (! empty($data['gift_id'])) {
            $g = DB::table('voting_gifts')->where('id', $data['gift_id'])->where('event_id', $event->id)->where('active', 1)->first();
            if (! $g) {
                throw ValidationException::withMessages(['gift_id' => 'Gift tidak tersedia.']);
            }
            $votes = (int) $g->votes;
            $amount = (int) $g->price;
        } else {
            $votes = (int) ($data['votes'] ?? 0);
            if ($votes < (int) $s->min_votes) {
                throw ValidationException::withMessages(['votes' => "Minimal {$s->min_votes} vote per transaksi."]);
            }
            $amount = $votes * (int) $s->price_per_vote;
        }

        $msg = $s->message_enabled ? Str::limit(trim((string) ($data['message'] ?? '')), (int) $s->message_max, '') : null;
        $code = strtoupper(Str::random(10));

        DB::table('voting_orders')->insert([
            'code' => $code, 'event_id' => $event->id, 'participant_id' => (int) $data['participant_id'],
            'gift_id' => $data['gift_id'] ?? null, 'buyer_name' => trim($data['buyer_name']), 'buyer_email' => $data['buyer_email'],
            'votes' => $votes, 'amount' => $amount, 'message' => $msg ?: null, 'status' => 'menunggu',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return back()->with('order_code', $code)->with('pay_online', true);
    }
}
