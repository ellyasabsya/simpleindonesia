<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TicketViewController extends Controller
{
    private function date(?string $d): string
    {
        return $d ? Carbon::parse($d)->locale('id')->translatedFormat('l, j F Y') : '-';
    }

    /** Halaman tiket per kode. Kode acak 24 karakter, tanpa data pribadi selain nama pemegang. */
    public function show(string $code): Response
    {
        $t = DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->join('events as e', 'e.id', '=', 'h.event_id')
            ->join('ticket_types as tt', 'tt.id', '=', 'h.ticket_type_id')
            ->where('h.code', $code)
            ->where('o.status', 'lunas')
            ->first(['h.code', 'h.holder_name', 'h.checked_in_at', 'e.title', 'e.location', 'e.starts_at', 'tt.name as type_name', 'h.visit_date', 'h.id', 'e.ends_at']);
        abort_unless($t, 404);

        return Inertia::render('tiket-detail', ['ticket' => [
            'code' => $t->code,
            'holder_name' => $t->holder_name,
            'checked_in' => \App\Support\DailyUse::used($t, $t->ends_at),
            'event_title' => $t->title,
            'location' => $t->location,
            'date' => $this->date(($t->visit_date ?? null) ?: $t->starts_at),
            'type_name' => $t->type_name,
        ]]);
    }

    public function mine(Request $request): Response
    {
        $user = $request->user();

        $orders = DB::table('ticket_orders as o')
            ->join('events as e', 'e.id', '=', 'o.event_id')
            ->where('o.status', 'lunas')
            ->where(function ($q) use ($user) {
                $q->where('o.user_id', $user->id);
                if ($user->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(o.buyer_email)) = ?', [mb_strtolower(trim($user->email))]);
                }
            })
            ->orderByDesc('o.id')
            ->get(['o.id', 'o.code', 'e.title', 'e.location', 'e.starts_at', 'o.visit_date', 'e.ends_at']);

        $holders = DB::table('ticket_holders')->whereIn('ticket_order_id', $orders->pluck('id'))
            ->get(['id', 'ticket_order_id', 'code', 'holder_name', 'checked_in_at', 'visit_date'])->groupBy('ticket_order_id');
        $usedToday = \App\Support\DailyUse::todayIds($holders->flatten()->pluck('id')->all());

        return Inertia::render('tiket-saya', ['orders' => $orders->map(fn ($o) => [
            'code' => $o->code,
            'event_title' => $o->title,
            'location' => $o->location,
            'date' => $this->date(($o->visit_date ?? null) ?: $o->starts_at),
            'tickets' => ($holders[$o->id] ?? collect())->map(fn ($h) => [
                'code' => $h->code, 'holder_name' => $h->holder_name, 'checked_in' => \App\Support\DailyUse::used($h, $o->ends_at, $usedToday),
            ])->values(),
        ])->values()]);
    }
}
