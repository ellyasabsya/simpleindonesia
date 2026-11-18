<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect('/admin');
        }

        $institutions = Institution::where('user_id', $user->id)->latest()->get();
        $approved = $institutions->firstWhere('status', Institution::APPROVED);
        $current = $approved ?? $institutions->first();

        $events = Event::whereIn('institution_id', $institutions->pluck('id'))->with('institution:id,name');

        $total = (clone $events)->count();
        $published = (clone $events)->where('status', Event::PUBLISHED)->count();
        $pending = (clone $events)->where('status', Event::PENDING)->count();
        $rejected = (clone $events)->where('status', Event::REJECTED)->count();

        $nearest = (clone $events)
            ->where('status', Event::PUBLISHED)
            ->whereDate('ends_at', '>=', now()->toDateString())
            ->orderBy('starts_at')
            ->first();

        $recent = (clone $events)->latest()->limit(5)->get()->map(fn (Event $e) => [
            'id' => $e->id,
            'title' => $e->title,
            'institution' => $e->institution?->name,
            'starts_at' => $e->starts_at->toDateString(),
            'status' => $e->status,
        ]);

        return Inertia::render('dashboard', [
            'hasPanel' => (bool) $approved,
            'institution' => $current?->only('id', 'name', 'status'),
            'institutionCount' => $institutions->count(),
            'summary' => [
                'total' => $total,
                'published' => $published,
                'pending' => $pending,
                'rejected' => $rejected,
                'publishRate' => $total ? (int) round($published / $total * 100) : 0,
            ],
            'nearest' => $nearest ? [
                'title' => $nearest->title,
                'starts_at' => $nearest->starts_at->toDateString(),
            ] : null,
            'recent' => $recent,
            'steps' => [
                ['label' => 'Akun dibuat', 'done' => true],
                ['label' => 'Daftarkan lembaga', 'done' => $institutions->isNotEmpty(), 'href' => '/lembaga/daftar'],
                ['label' => 'Lembaga terverifikasi', 'done' => (bool) $approved],
                ['label' => 'Ajukan event pertama', 'done' => $total > 0, 'href' => '/panel/ajukan'],
                ['label' => 'Event tayang', 'done' => $published > 0],
            ],
        ]);
    }
}
