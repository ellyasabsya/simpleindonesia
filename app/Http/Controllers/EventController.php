<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public const PER_PAGE = 8;

    public function __invoke(Request $request, HomeController $home): Response
    {
        $q = trim((string) $request->query('q', ''));
        $cat = (string) $request->query('kategori', '');

        $base = Event::main()->where('status', Event::PUBLISHED);

        $events = (clone $base)
            ->with(['institution', 'children'])
            ->when($q !== '', fn ($x) => $x->where(fn ($w) => $w
                ->where('title', 'like', '%'.$q.'%')
                ->orWhere('location', 'like', '%'.$q.'%')))
            ->when($cat !== '', fn ($x) => $x->where('category', $cat))
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Event $e) => $home->card($e));

        $labelsConst = '\App\Http\Controllers\Panel\EventController::CATEGORIES';
        $labels = defined($labelsConst) ? constant($labelsConst) : [];

        $categories = (clone $base)
            ->whereNotNull('category')
            ->selectRaw('category, count(*) as n')
            ->groupBy('category')
            ->pluck('n', 'category')
            ->map(fn ($n, $key) => ['key' => $key, 'label' => $labels[$key] ?? ucfirst($key), 'count' => (int) $n])
            ->values();

        return Inertia::render('events', [
            'events' => $events,
            'categories' => $categories,
            'total' => (clone $base)->count(),
            'filters' => ['q' => $q, 'kategori' => $cat],
        ]);
    }
}
