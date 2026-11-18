<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketSupportController extends Controller
{
    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        abort_unless($event->registration_method === 'ticket' && $event->status === Event::PUBLISHED, 404);
    }

    /** Daftar pilihan + jumlah dukungan (tiket lunas), urut terbanyak. */
    public static function ranking(int $eventId): array
    {
        return DB::table('ticket_support_options as o')
            ->leftJoin('ticket_orders as t', fn ($j) => $j->on('t.support_option_id', '=', 'o.id')->where('t.status', 'lunas'))
            ->where('o.event_id', $eventId)
            ->groupBy('o.id', 'o.name')
            ->orderByRaw('COALESCE(SUM(t.quantity),0) desc')->orderBy('o.name')
            ->get(['o.id', 'o.name', DB::raw('COALESCE(SUM(t.quantity),0) as votes')])
            ->map(fn ($r) => ['id' => (int) $r->id, 'name' => $r->name, 'votes' => (int) $r->votes])
            ->all();
    }

    public function index(Request $request, Event $event): JsonResponse
    {
        $this->guard($request, $event);

        return response()->json(['options' => self::ranking($event->id)]);
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate(['name' => ['required', 'string', 'max:80']], [
            'name.required' => 'Isi nama pilihan dukungan.',
        ]);
        $name = trim($data['name']);

        if (DB::table('ticket_support_options')->where('event_id', $event->id)->whereRaw('lower(name) = ?', [mb_strtolower($name)])->exists()) {
            return back()->withErrors(['name' => 'Pilihan dukungan itu sudah ada.']);
        }
        if (DB::table('ticket_support_options')->where('event_id', $event->id)->count() >= 50) {
            return back()->withErrors(['name' => 'Maksimal 50 pilihan dukungan.']);
        }

        DB::table('ticket_support_options')->insert(['event_id' => $event->id, 'name' => $name, 'created_at' => now(), 'updated_at' => now()]);

        return back()->with('success', 'Pilihan dukungan ditambahkan.');
    }

    public function destroy(Request $request, Event $event, int $option): RedirectResponse
    {
        $this->guard($request, $event);
        abort_unless(DB::table('ticket_support_options')->where('id', $option)->where('event_id', $event->id)->exists(), 404);

        if (DB::table('ticket_orders')->where('support_option_id', $option)->where('status', '!=', 'batal')->exists()) {
            return back()->with('error', 'Pilihan yang sudah didukung pembeli tidak bisa dihapus.');
        }

        DB::table('ticket_support_options')->where('id', $option)->delete();

        return back()->with('success', 'Pilihan dukungan dihapus.');
    }
}
