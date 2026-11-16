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
        $rows = Ticket::with('event')
            ->where('user_id', $request->user()->id)->latest()->get()
            ->map(fn ($t) => [
                'id' => $t->id, 'code' => $t->code, 'quantity' => $t->quantity,
                'total_price' => $t->total_price, 'status' => $t->status,
            ] + $this->eventData($t->event))
            ->all();

        return Inertia::render('saya/tiket', ['rows' => $rows]);
    }
}
