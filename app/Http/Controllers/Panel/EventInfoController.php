<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EventInfoController extends Controller
{
    private const KINDS = ['pembukaan', 'sesi', 'lomba', 'istirahat', 'penutupan', 'lainnya'];

    private const CATS = ['info', 'penting', 'perubahan', 'pembayaran', 'logistik'];

    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
    }

    private function d($v): ?string
    {
        return $v ? substr((string) $v, 0, 10) : null;
    }

    private function t($v): ?string
    {
        return $v ? substr((string) $v, 0, 5) : null;
    }

    private function label($v): string
    {
        return Carbon::parse($v)->locale('id')->translatedFormat('j M Y, H:i');
    }

    private function rundown(int $eventId): array
    {
        return DB::table('event_rundown_items')->where('event_id', $eventId)
            ->orderBy('date')->orderBy('start_time')->orderBy('sort')->orderBy('id')->get()
            ->map(fn ($r) => [
                'date' => $this->d($r->date), 'start_time' => $this->t($r->start_time), 'end_time' => $this->t($r->end_time),
                'title' => $r->title, 'kind' => $r->kind, 'pic' => $r->pic, 'location' => $r->location, 'notes' => $r->notes,
            ])->all();
    }

    private function announcements(int $eventId, bool $onlyPublished): array
    {
        $q = DB::table('event_announcements')->where('event_id', $eventId);
        if ($onlyPublished) {
            $q->whereNotNull('published_at');
        }

        return $q->orderByDesc('pinned')->orderByDesc('updated_at')->orderByDesc('id')->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id, 'title' => $r->title, 'body' => $r->body, 'category' => $r->category,
                'pinned' => (bool) $r->pinned, 'published' => $r->published_at !== null,
                'updated_label' => $this->label($r->updated_at),
            ])->all();
    }

    /** Dipakai CalendarController untuk melengkapi props halaman kalender. */
    public function props(Event $event): array
    {
        if (! Schema::hasTable('event_rundown_items') || ! Schema::hasTable('event_announcements')) {
            return ['rundown' => [], 'announcements' => [], 'rundownPublished' => false, 'infoUrl' => null];
        }

        return [
            'rundown' => $this->rundown($event->id),
            'announcements' => $this->announcements($event->id, false),
            'rundownPublished' => (bool) ($event->rundown_published ?? false),
            'infoUrl' => ($event->info_token ?? null) ? url('/info-event/'.$event->info_token) : null,
        ];
    }

    public function rundownSync(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $start = Carbon::parse($event->starts_at)->toDateString();
        $end = Carbon::parse($event->ends_at)->toDateString();

        $data = $request->validate([
            'items' => ['present', 'array', 'max:300'],
            'items.*.date' => ['required', 'date', 'after_or_equal:'.$start, 'before_or_equal:'.$end],
            'items.*.start_time' => ['required', 'date_format:H:i'],
            'items.*.end_time' => ['nullable', 'date_format:H:i'],
            'items.*.title' => ['required', 'string', 'max:150'],
            'items.*.kind' => ['required', 'in:'.implode(',', self::KINDS)],
            'items.*.pic' => ['nullable', 'string', 'max:100'],
            'items.*.location' => ['nullable', 'string', 'max:150'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ], [
            'required' => ':attribute wajib diisi.',
            'date_format' => 'Format jam tidak valid.',
            'after_or_equal' => 'Tanggal sesi harus di dalam rentang event.',
            'before_or_equal' => 'Tanggal sesi harus di dalam rentang event.',
        ]);

        foreach ($data['items'] as $i => $it) {
            if (! empty($it['end_time']) && $it['end_time'] <= $it['start_time']) {
                throw ValidationException::withMessages(["items.$i.end_time" => 'Jam selesai harus setelah jam mulai (sesi ke-'.($i + 1).').']);
            }
        }

        DB::transaction(function () use ($event, $data) {
            DB::table('event_rundown_items')->where('event_id', $event->id)->delete();
            $rows = [];
            foreach ($data['items'] as $i => $it) {
                $rows[] = [
                    'event_id' => $event->id, 'date' => $it['date'], 'start_time' => $it['start_time'],
                    'end_time' => $it['end_time'] ?? null, 'title' => $it['title'], 'kind' => $it['kind'],
                    'pic' => $it['pic'] ?? null, 'location' => $it['location'] ?? null, 'notes' => $it['notes'] ?? null,
                    'sort' => $i, 'created_at' => now(), 'updated_at' => now(),
                ];
            }
            if ($rows) {
                DB::table('event_rundown_items')->insert($rows);
            }
        });

        return back();
    }

    public function publish(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate([
            'rundown_published' => ['sometimes', 'boolean'],
            'regenerate' => ['sometimes', 'boolean'],
        ]);

        $update = ['updated_at' => now()];
        if (array_key_exists('rundown_published', $data)) {
            $update['rundown_published'] = $data['rundown_published'];
        }
        if (! ($event->info_token ?? null) || ! empty($data['regenerate'])) {
            $update['info_token'] = Str::random(24);
        }
        DB::table('events')->where('id', $event->id)->update($update);

        return back();
    }

    private function announcementData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:2000'],
            'category' => ['required', 'in:'.implode(',', self::CATS)],
            'pinned' => ['boolean'],
            'published' => ['boolean'],
        ], ['required' => ':attribute wajib diisi.'], ['title' => 'Judul', 'body' => 'Isi pengumuman']);
    }

    public function announcementStore(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $d = $this->announcementData($request);
        DB::table('event_announcements')->insert([
            'event_id' => $event->id, 'title' => $d['title'], 'body' => $d['body'], 'category' => $d['category'],
            'pinned' => (bool) ($d['pinned'] ?? false),
            'published_at' => ! empty($d['published']) ? now() : null,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return back();
    }

    public function announcementUpdate(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $row = DB::table('event_announcements')->where('id', $item)->where('event_id', $event->id)->first();
        abort_unless($row, 404);
        $d = $this->announcementData($request);

        $published = ! empty($d['published']) ? ($row->published_at ?? now()) : null;
        DB::table('event_announcements')->where('id', $item)->update([
            'title' => $d['title'], 'body' => $d['body'], 'category' => $d['category'],
            'pinned' => (bool) ($d['pinned'] ?? false), 'published_at' => $published, 'updated_at' => now(),
        ]);

        return back();
    }

    public function announcementDestroy(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        DB::table('event_announcements')->where('id', $item)->where('event_id', $event->id)->delete();

        return back();
    }

    /** Halaman publik untuk peserta. */
    public function show(string $token)
    {
        abort_if(strlen($token) < 10, 404);
        $event = Event::where('info_token', $token)->first();
        abort_unless($event, 404);

        $published = (bool) $event->rundown_published;
        $updated = $published ? DB::table('event_rundown_items')->where('event_id', $event->id)->max('updated_at') : null;

        return Inertia::render('info-event', [
            'event' => [
                'title' => $event->title,
                'starts_at' => Carbon::parse($event->starts_at)->toDateString(),
                'ends_at' => Carbon::parse($event->ends_at)->toDateString(),
                'location' => $event->location ?? null,
            ],
            'rundown' => $published ? $this->rundown($event->id) : [],
            'rundownUpdated' => $updated ? $this->label($updated) : null,
            'announcements' => $this->announcements($event->id, true),
        ]);
    }
}
