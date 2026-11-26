<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventDetailController extends Controller
{
    public function __invoke(Request $request, string $key, HomeController $home): Response
    {
        $event = Event::query()
            ->where(fn ($q) => $q->where('status', Event::PUBLISHED)
                ->orWhereIn('parent_id', Event::where('status', Event::PUBLISHED)->select('id')))
            ->where(fn ($q) => $q->where('slug', $key)
                ->when(ctype_digit($key), fn ($w) => $w->orWhere('id', (int) $key)))
            ->with(['institution', 'children' => fn ($q) => $q->orderBy('sub_order')->orderBy('id'), 'children.ticketTypes']) // patch-248
            ->firstOrFail();

        $parent = $event->parent_id ? Event::find($event->parent_id) : null;

        $labelsConst = '\App\Http\Controllers\Panel\EventController::CATEGORIES';
        $labels = defined($labelsConst) ? constant($labelsConst) : [];

        $contact = array_filter([
            'name' => $event->contact_name,
            'position' => $event->contact_position,
            'phone' => $event->contact_phone,
            'email' => $event->contact_email,
        ]);

        $userId = $request->user()?->id;

        $all = collect([$event])->concat($event->children);
        $feeSources = $event->children->isNotEmpty() ? $event->children : collect([$event]);
        $feeList = $feeSources->flatMap(fn ($c) => $c->registration_method === 'ticket' && $c->ticketTypes->isNotEmpty()
            ? $c->ticketTypes->pluck('price')
            : collect([$c->registration_fee]))->map(fn ($v) => (int) $v)->values();
        $eventIds = $all->pluck('id')->all();
        $cats = \Illuminate\Support\Facades\DB::table('event_participant_categories')->whereIn('event_id', $eventIds)->get()->groupBy('event_id');
        $regs = \App\Models\EventRegistration::query()->with('user:id,name')->whereIn('event_id', $eventIds)->get();
        $tix = \Illuminate\Support\Facades\DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->join('ticket_types as t', 't.id', '=', 'h.ticket_type_id')
            ->whereIn('h.event_id', $eventIds)->where('o.status', 'lunas')
            ->where(fn ($q) => $q->where('t.audience', 'peserta')->orWhere('t.name', 'like', 'Pendaftaran%'))
            ->get(['h.id', 'h.event_id', 'h.holder_name', 't.participant_category_id']);

        $branches = collect();
        foreach ($all as $ev) {
            $isChild = $ev->id !== $event->id;
            $evCats = $cats->get($ev->id, collect());
            $evRegs = $regs->where('event_id', $ev->id);

            $push = function ($key, $title, $subtitle, $quota, $mine, $extra = [], $tx = null) use (&$branches) {
                $tx = $tx ?? collect();
                $ok = $mine->whereIn('status', ['terdaftar', 'disetujui', 'lunas']);
                $branches->push([
                    'id' => $key,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'quota' => $quota,
                    'registered' => $mine->count() + $tx->count(),
                    'approved' => $ok->count() + $tx->count(),
                    'info' => $extra,
                    'names' => [],
                ]);
            };

            if ($evCats->isNotEmpty()) {
                foreach ($evCats as $cat) {
                    $prizes = json_decode($cat->prizes ?? '[]', true) ?: [];
                    $push('c'.$cat->id,
                        $cat->competition_name ?: ($isChild ? $ev->title : $cat->name),
                        $cat->competition_name ? $cat->name : ($isChild ? $cat->name : null),
                        (int) ($cat->quota ?? 0),
                        $evRegs->where('participant_category_id', $cat->id),
                        ['min_age' => $cat->min_age, 'max_age' => $cat->max_age, 'requirements' => $cat->requirements, 'prizes' => $prizes], $tix->where('event_id', $ev->id)->filter(fn ($x) => $x->participant_category_id !== null ? (int) $x->participant_category_id === (int) $cat->id : $evCats->count() === 1));
                }
            } elseif ((int) $ev->participant_quota > 0) {
                $push('e'.$ev->id, $isChild ? $ev->title : 'Kuota peserta', null, (int) $ev->participant_quota, $evRegs, [], $tix->where('event_id', $ev->id));
            }
        }

        $participants = [
            'registered' => $regs->count() + $tix->count(),
            'approved' => $regs->whereIn('status', ['terdaftar', 'disetujui', 'lunas'])->count() + $tix->count(),
            'branches' => $branches->values(),
        ];

        return Inertia::render('event-detail', [
            'event' => array_merge($home->card($event), [
                'description' => $event->description,
                'contact' => $contact ?: null,
                'juknis' => $event->juknisUrl(),
                'participants' => $participants,
                'has_competition' => $all->contains(fn (Event $ev) => in_array($ev->category, ['perlombaan', 'olahraga'], true)),
                'parent' => $parent ? ['title' => $parent->title, 'slug' => $parent->slug] : null,
                'siblings' => $parent ? $parent->children()->orderBy('sub_order')->orderBy('id')->get()
                    ->map(fn (Event $x) => ['id' => $x->id, 'title' => $x->title, 'slug' => $x->slug])->values() : [],
                'registration_state' => $event->registrationState(),
                'registration_opens' => optional($event->registrationWindow()[0])->toDateString(),
                'registration_closes' => optional($event->registrationWindow()[1])->toDateString(),
                'registration_fee_min' => (int) ($feeList->min() ?? 0),
                'registration_fee_max' => (int) ($feeList->max() ?? 0),
                'registration_fee' => (int) ($event->registration_fee ?: ($event->children->flatMap(fn ($c) => $c->registration_method === 'ticket' && $c->ticketTypes->isNotEmpty() ? $c->ticketTypes->pluck('price') : collect([$c->registration_fee]))->filter()->min() ?? 0)),
                'registration_method' => $event->registration_method
                    ?: (($m = $event->children->pluck('registration_method')->filter()->unique())->count() === 1 ? $m->first() : null),
                'children' => $event->children->map(fn (Event $c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'category' => $c->category ? ($labels[$c->category] ?? ucfirst($c->category)) : null,
                    'location' => $c->location,
                    'starts_at' => $c->starts_at?->toDateString(),
                    'ends_at' => $c->ends_at?->toDateString(),
                    'juknis' => $c->juknisUrl(),
                    'registration_fee' => (int) $c->registration_fee,
                    'description' => $c->description,
                    'registration_method' => $c->registration_method,
                    'contact' => array_filter([
                        'name' => $c->contact_name,
                        'position' => $c->contact_position,
                        'phone' => $c->contact_phone,
                        'email' => $c->contact_email,
                    ]) ?: null, // patch-253
                    'ticket_price' => $c->registration_method === 'ticket' && $c->ticketTypes->isNotEmpty() ? (int) $c->ticketTypes->min('price') : null,
                    'ticket_open' => $c->registration_method === 'ticket' && (bool) $c->ticket_sales_open && $c->ticketTypes->isNotEmpty(),
                    'ticket_left' => $c->registration_method === 'ticket' && $c->ticketTypes->isNotEmpty()
                        ? (int) $c->ticketTypes->sum(fn ($t) => max(0, $t->quota - \App\Http\Controllers\Panel\TicketSettingsController::sold($t->id)))
                        : null,
                    'slug' => $c->slug,
                    'poster' => $c->posterUrl() ?: $event->posterUrl(),
                    'quota' => (int) \Illuminate\Support\Facades\DB::table('event_participant_categories')->where('event_id', $c->id)->sum('quota'),
                    'registered' => \App\Models\EventRegistration::where('event_id', $c->id)->count(),
                ])->values(),
                'comments' => $event->comments()
                    ->with('user:id,name')
                    ->latest()
                    ->limit(50)
                    ->get()
                    ->map(fn ($c) => [
                        'id' => $c->id,
                        'body' => $c->body,
                        'author' => $c->user?->name ?? 'Pengguna',
                        'created_at' => $c->created_at->toIso8601String(),
                        'mine' => $userId !== null && $userId === $c->user_id,
                        'reported' => $c->reported_at !== null,
                    ])->values(),
            ]),
        ]);
    }
}
