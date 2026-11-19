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
            ->first(['h.code', 'h.holder_name', 'h.checked_in_at', 'e.title', 'e.location', 'e.starts_at', 'tt.name as type_name']);
        abort_unless($t, 404);

        return Inertia::render('tiket-detail', ['ticket' => [
            'code' => $t->code,
            'holder_name' => $t->holder_name,
            'checked_in' => (bool) $t->checked_in_at,
            'event_title' => $t->title,
            'location' => $t->location,
            'date' => $this->date($t->starts_at),
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
            ->get(['o.id', 'o.code', 'e.title', 'e.location', 'e.starts_at']);

        $holders = DB::table('ticket_holders')->whereIn('ticket_order_id', $orders->pluck('id'))
            ->get(['ticket_order_id', 'code', 'holder_name', 'checked_in_at'])->groupBy('ticket_order_id');

        return Inertia::render('tiket-saya', ['orders' => $orders->map(fn ($o) => [
            'code' => $o->code,
            'event_title' => $o->title,
            'location' => $o->location,
            'date' => $this->date($o->starts_at),
            'tickets' => ($holders[$o->id] ?? collect())->map(fn ($h) => [
                'code' => $h->code, 'holder_name' => $h->holder_name, 'checked_in' => (bool) $h->checked_in_at,
            ])->values(),
        ])->values()]);
    }
}
