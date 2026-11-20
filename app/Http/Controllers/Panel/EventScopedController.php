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
    /** Daftar ID registrasi (formulir dan tiket) untuk event ini, atau semua sub-event kalau ia induk. */
    protected function regIds(Event $event): array
    {
        $db = \Illuminate\Support\Facades\DB::class;
        $ids = $event->parent_id === null && $event->children()->exists() ? $event->children()->pluck('id')->all() : [$event->id];
        $titles = $db::table('events')->whereIn('id', $ids)->pluck('title', 'id');
        $multi = count($ids) > 1;
        $cats = $db::table('event_participant_categories')->pluck('name', 'id');
        $types = $db::table('ticket_types')->whereIn('event_id', $ids)->pluck('name', 'id');

        $regs = $db::table('event_registrations')->whereIn('event_id', $ids)->orderBy('id')->get();
        $userNames = $db::table('users')->whereIn('id', $regs->pluck('user_id')->filter()->all())->pluck('name', 'id');
        $forms = $regs->map(fn ($r) => [
            'code' => $r->reg_code,
            'name' => $r->contact_name ?: ($userNames[$r->user_id] ?? '-'),
            'kind' => $cats[$r->participant_category_id] ?? '-',
            'status' => (string) $r->status,
            'event' => $multi ? ($titles[$r->event_id] ?? null) : null,
        ]);
        $tickets = $db::table('ticket_holders')->whereIn('event_id', $ids)->orderBy('id')->get()->map(fn ($h) => [
            'code' => $h->reg_code,
            'name' => $h->holder_name ?: '-',
            'kind' => 'Tiket '.($types[$h->ticket_type_id] ?? ''),
            'status' => 'Terdaftar',
            'event' => $multi ? ($titles[$h->event_id] ?? null) : null,
        ]);

        return $forms->concat($tickets)->sortBy('code')->values()->take(500)->all();
    }

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
            'regIds' => str_contains($component, 'registrasi') ? $this->regIds($event) : [],
        ], $props));
    }

    protected function nav(Event $event): array
    {
        $labels = config('features.menus');
        $allowed = $event->status === Event::PUBLISHED ? $event->menus() : [];

        $items = collect(array_keys($labels))
            ->filter(fn ($key) => $key === 'dashboard' || (in_array($key, $allowed, true) && ! $event->parent_id)) // patch-266: sub-event hanya menampilkan Dashboard; menu lain dikelola dari event induk
            ->map(fn ($key) => [
                'key' => $key,
                'label' => $labels[$key],
                'href' => $key === 'dashboard' ? "/panel/event/{$event->id}" : "/panel/event/{$event->id}/{$key}",
            ])
            ->values()
            ->all();

        $nav = ['title' => Str::limit($event->title, 22), 'items' => $items];

        if ($event->parent_id) {
            $parent = $event->parent()->first();
            if ($parent) {
                $nav['parent'] = ['title' => Str::limit($parent->title, 24), 'href' => "/panel/event/{$parent->id}"];
            }
        } // patch-266: daftar SUB-EVENT di sidebar induk dihapus

        return $nav;
    }
}
