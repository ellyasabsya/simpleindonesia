<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MyActivityController extends Controller
{
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
            ->where('user_id', $request->user()->id)->latest()->get()
            ->map(fn ($r) => ['id' => $r->id, 'status' => $r->status] + $this->eventData($r->event))
            ->all();

        return Inertia::render('saya/lomba', ['rows' => $rows]);
    }

    public function tiket(Request $request)
    {
        $orders = \Illuminate\Support\Facades\DB::table('ticket_orders')
            ->where('status', 'lunas')->where('user_id', $request->user()->id)
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
