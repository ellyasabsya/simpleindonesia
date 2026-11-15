<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Dasar untuk semua halaman di dalam dashboard satu event. */
abstract class EventScopedController extends Controller
{
    protected function render(string $component, Event $event, array $props = []): Response
    {
        return Inertia::render($component, array_merge([
            'institution' => $event->institution->only('id', 'name'),
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'category' => EventController::CATEGORIES[$event->category] ?? $event->category,
                'location' => $event->location,
                'starts_at' => $event->starts_at->toDateString(),
                'ends_at' => $event->ends_at->toDateString(),
                'status' => $event->status,
                'rejection_reason' => $event->rejection_reason,
                'poster_url' => $event->posterUrl(),
                'package' => $event->package_snapshot['name'] ?? '-',
                'share_percent' => $event->package_snapshot['share_percent'] ?? null,
            ],
            'eventNav' => $this->nav($event),
        ], $props));
    }

    private function nav(Event $event): array
    {
        $labels = config('features.menus');
        $allowed = $event->status === Event::PUBLISHED ? $event->menus() : [];

        $items = collect(array_keys($labels))
            ->filter(fn ($key) => $key === 'dashboard' || in_array($key, $allowed, true))
            ->map(fn ($key) => [
                'key' => $key,
                'label' => $labels[$key],
                'href' => $key === 'dashboard' ? "/panel/event/{$event->id}" : "/panel/event/{$event->id}/{$key}",
            ])
            ->values()
            ->all();

        return ['title' => Str::limit($event->title, 22), 'items' => $items];
    }
}
