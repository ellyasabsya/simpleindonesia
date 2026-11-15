<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Panel\EventController as PanelEventController;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /** Manajemen Event: semua event. */
    public function index(Request $request): Response
    {
        return $this->list($request, 'all', '/admin/events', 'Manajemen Event');
    }

    /** Review Event: dibuka di tab menunggu. */
    public function review(Request $request): Response
    {
        return $this->list($request, 'pending', '/admin/review', 'Review Event');
    }

    public function approve(Event $event): RedirectResponse
    {
        $event->update([
            'status' => Event::PUBLISHED,
            'rejection_reason' => null,
            'reviewed_at' => now(),
        ]);

        return back();
    }

    public function reject(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        $event->update([
            'status' => Event::REJECTED,
            'rejection_reason' => $data['reason'],
            'reviewed_at' => now(),
        ]);

        return back();
    }

    private function list(Request $request, string $default, string $base, string $title): Response
    {
        $status = $request->query('status', $default);
        $status = in_array($status, ['all', Event::PENDING, Event::PUBLISHED, Event::REJECTED], true) ? $status : $default;
        $search = trim((string) $request->query('search', ''));

        $events = Event::with('institution:id,name')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where(function ($w) use ($search) {
                $w->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('institution', fn ($i) => $i->where('name', 'like', "%{$search}%"));
            }))
            ->latest()
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'category' => PanelEventController::CATEGORIES[$e->category] ?? $e->category,
                'location' => $e->location,
                'starts_at' => $e->starts_at->toDateString(),
                'ends_at' => $e->ends_at->toDateString(),
                'status' => $e->status,
                'rejection_reason' => $e->rejection_reason,
                'poster_url' => $e->posterUrl(),
                'institution' => $e->institution?->name,
                'package' => $e->package_snapshot['name'] ?? '-',
                'share_percent' => $e->package_snapshot['share_percent'] ?? null,
            ]);

        return Inertia::render('admin/events', [
            'events' => $events,
            'filters' => ['status' => $status, 'search' => $search],
            'counts' => [
                'all' => Event::count(),
                'pending' => Event::where('status', Event::PENDING)->count(),
                'published' => Event::where('status', Event::PUBLISHED)->count(),
                'rejected' => Event::where('status', Event::REJECTED)->count(),
            ],
            'base' => $base,
            'pageTitle' => $title,
        ]);
    }
}
