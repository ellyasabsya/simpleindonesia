<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Satu tombol buka/tutup penjualan untuk semua kegiatan bertiket dalam satu rangkaian. */
class SeriesTicketController extends Controller
{
    private function children(Request $request, Event $event)
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);

        return $event->children()
            ->where('status', Event::PUBLISHED)
            ->where('registration_method', 'ticket')
            ->whereHas('ticketTypes');
    }

    public function status(Request $request, Event $event): JsonResponse
    {
        $kids = $this->children($request, $event)->get(['id', 'ticket_sales_open']);

        return response()->json([
            'count' => $kids->count(),
            'open' => $kids->count() > 0 && $kids->every(fn ($k) => (bool) $k->ticket_sales_open),
            'some_open' => $kids->contains(fn ($k) => (bool) $k->ticket_sales_open),
        ]);
    }

    public function toggle(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate(['open' => ['required', 'boolean']]);
        $q = $this->children($request, $event);

        if ($q->count() === 0) {
            return back()->with('error', 'Belum ada kegiatan dengan tiket di rangkaian ini.');
        }
        $q->update(['ticket_sales_open' => $data['open'] ? 1 : 0]);

        return back()->with('success', $data['open'] ? 'Penjualan semua kegiatan dibuka.' : 'Penjualan semua kegiatan ditutup.');
    }
}
