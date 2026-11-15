<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PanelController extends Controller
{
    private function institution(Request $request): array
    {
        return $request->attributes->get('institution')->only('id', 'name');
    }

    public function dashboard(Request $request): Response
    {
        $id = $request->attributes->get('institution')->id;
        $events = Event::where('institution_id', $id);

        $total = (clone $events)->count();
        $published = (clone $events)->where('status', Event::PUBLISHED)->count();
        $pending = (clone $events)->where('status', Event::PENDING)->count();

        return Inertia::render('panel/dashboard', [
            'institution' => $this->institution($request),
            'pending' => [
                ['label' => 'Event menunggu review', 'value' => $pending],
                ['label' => 'Pesanan tiket menunggu', 'value' => 0],
                ['label' => 'Penarikan dana diproses', 'value' => 0],
            ],
            'stats' => [
                ['label' => 'Total event', 'value' => (string) $total, 'note' => $total ? 'Semua pengajuan' : 'Belum ada event'],
                ['label' => 'Event tayang', 'value' => (string) $published, 'note' => ($total - $published).' belum tayang'],
                ['label' => 'Tiket terjual', 'value' => '0', 'note' => 'Semua event'],
                ['label' => 'Pendapatan', 'value' => 'Rp0', 'note' => 'Setelah biaya layanan'],
            ],
        ]);
    }

    public function placeholder(Request $request, string $title): Response
    {
        return Inertia::render('panel/placeholder', [
            'institution' => $this->institution($request),
            'title' => $title,
        ]);
    }
}
