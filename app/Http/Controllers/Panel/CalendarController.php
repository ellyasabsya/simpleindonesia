<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CalendarController extends Controller
{
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

    public function index(Request $request, Event $event)
    {
        $this->guard($request, $event);

        // Rangkaian event: kalender hanya satu, di event utama.
        if ($event->parent_id) {
            return redirect('/panel/event/'.$event->parent_id.'/kalender');
        }

        $props = [
            'eventId' => $event->id,
            'event' => [
                'title' => $event->title,
                'starts_at' => Carbon::parse($event->starts_at)->toDateString(),
                'ends_at' => Carbon::parse($event->ends_at)->toDateString(),
            ],
            'phases' => [
                'registration' => ['start' => $this->d($event->registration_start), 'end' => $this->d($event->registration_end)],
                'preparation' => ['start' => $this->d($event->preparation_start), 'end' => $this->d($event->preparation_end)],
            ],
            'agendas' => DB::table('event_agendas')->where('event_id', $event->id)
                ->orderBy('date')->orderBy('start_time')->orderBy('id')->get()
                ->map(fn ($r) => [
                    'id' => (int) $r->id, 'title' => $r->title, 'date' => $this->d($r->date),
                    'start_time' => $this->t($r->start_time), 'end_time' => $this->t($r->end_time),
                    'location' => $r->location, 'description' => $r->description, 'type' => $r->type,
                    'remind_minutes' => $r->remind_minutes !== null ? (int) $r->remind_minutes : null,
                ])->all(),
        ];

        // Event utama: tampilkan agenda semua sub-event (baca-saja).
        $props['subAgendas'] = [];
        $subIds = $event->children()->pluck('id');
        if ($subIds->isNotEmpty()) {
            $props['subAgendas'] = DB::table('event_agendas')
                ->join('events', 'events.id', '=', 'event_agendas.event_id')
                ->whereIn('event_agendas.event_id', $subIds)
                ->orderBy('event_agendas.date')->orderBy('event_agendas.start_time')->orderBy('event_agendas.id')
                ->select('event_agendas.*', 'events.title as sub_title')->get()
                ->map(fn ($r) => [
                    'id' => (int) $r->id, 'sub_id' => (int) $r->event_id, 'sub_title' => $r->sub_title,
                    'title' => $r->title, 'date' => $this->d($r->date),
                    'start_time' => $this->t($r->start_time), 'end_time' => $this->t($r->end_time),
                    'location' => $r->location, 'description' => $r->description, 'type' => $r->type,
                ])->all();
        }

        $dash = app(\App\Http\Controllers\Panel\EventDashboardController::class);

        return \Closure::bind(fn () => $this->render('panel/events/kalender', $event, $props), $dash, \App\Http\Controllers\Panel\EventDashboardController::class)();
    }

    public function updatePhases(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate([
            'registration_start' => ['nullable', 'date'],
            'registration_end' => ['nullable', 'date', 'after_or_equal:registration_start'],
            'preparation_start' => ['nullable', 'date'],
            'preparation_end' => ['nullable', 'date', 'after_or_equal:preparation_start'],
        ], ['after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal mulai.', 'date' => 'Format tanggal tidak valid.']);

        DB::table('events')->where('id', $event->id)->update($data + ['updated_at' => now()]);

        return back();
    }

    private function agendaData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'type' => ['required', 'in:agenda,rapat,latihan,gladi,lainnya'],
            'remind_minutes' => ['nullable', 'integer', 'in:15,60,180,1440,4320'],
        ], ['required' => ':attribute wajib diisi.', 'date_format' => 'Format jam tidak valid.'], ['title' => 'Judul', 'date' => 'Tanggal']);

        if (! empty($data['start_time']) && ! empty($data['end_time']) && $data['end_time'] <= $data['start_time']) {
            throw ValidationException::withMessages(['end_time' => 'Jam selesai harus setelah jam mulai.']);
        }

        return $data;
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        DB::table('event_agendas')->insert($this->agendaData($request) + ['event_id' => $event->id, 'created_at' => now(), 'updated_at' => now()]);

        return back();
    }

    public function update(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        abort_unless(DB::table('event_agendas')->where('id', $item)->where('event_id', $event->id)->exists(), 404);
        // jadwal berubah: pengingat boleh dikirim ulang
        DB::table('event_agendas')->where('id', $item)->update($this->agendaData($request) + ['reminded_at' => null, 'updated_at' => now()]);

        return back();
    }

    public function destroy(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        DB::table('event_agendas')->where('id', $item)->where('event_id', $event->id)->delete();

        return back();
    }
}
