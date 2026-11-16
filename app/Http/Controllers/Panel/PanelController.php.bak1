<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\InstitutionMember;
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
        $i = $request->attributes->get('institution');
        $i->loadMissing('user:id,name,email');

        $events = Event::where('institution_id', $i->id)->latest()->get();

        $members = InstitutionMember::with('user:id,name,email')
            ->where('institution_id', $i->id)->get()
            ->map(fn ($m) => ['id' => $m->id, 'name' => $m->user?->name, 'email' => $m->user?->email, 'role' => $m->role]);

        return Inertia::render('panel/dashboard', [
            'institution' => [
                'id' => $i->id,
                'name' => $i->name,
                'email' => $i->email,
                'phone' => $i->phone,
                'status' => $i->status,
                'logo_url' => $i->logo_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($i->logo_path) : null,
            ],
            'isOwner' => $request->user()->id === $i->user_id,
            'owner' => ['name' => $i->user?->name, 'email' => $i->user?->email],
            'members' => $members,
            'counts' => [
                'total' => $events->count(),
                'published' => $events->where('status', Event::PUBLISHED)->count(),
                'pending' => $events->where('status', Event::PENDING)->count(),
                'rejected' => $events->where('status', Event::REJECTED)->count(),
            ],
            // Diisi setelah tabel transaksi tiket dibuat
            'balance' => ['available' => 0, 'processing' => 0, 'withdrawn' => 0],
            'events' => $events->map(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'category' => EventController::CATEGORIES[$e->category] ?? $e->category,
                'package' => $e->package_snapshot['name'] ?? '-',
                'starts_at' => $e->starts_at->toDateString(),
                'ends_at' => $e->ends_at->toDateString(),
                'status' => $e->status,
            ])->values(),
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
