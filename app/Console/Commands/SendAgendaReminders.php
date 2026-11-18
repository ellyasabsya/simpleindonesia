<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\User;
use App\Notifications\AgendaReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendAgendaReminders extends Command
{
    protected $signature = 'agenda:kirim-pengingat {--dry : Hanya tampilkan yang akan dikirim, tanpa mengirim}';

    protected $description = 'Kirim pengingat agenda event ke peserta (notifikasi aplikasi dan email).';

    private const CANCELLED = ['ditolak', 'dibatalkan', 'batal', 'rejected', 'cancelled', 'canceled', 'expired', 'kedaluwarsa'];

    public function handle(): int
    {
        $tz = config('app.agenda_timezone', 'Asia/Jakarta'); // jam agenda diisi panitia dalam waktu setempat
        $now = now();
        $dry = (bool) $this->option('dry');

        $rows = DB::table('event_agendas as a')->join('events as e', 'e.id', '=', 'a.event_id')
            ->where('e.status', Event::PUBLISHED)
            ->whereNotNull('a.remind_minutes')->whereNull('a.reminded_at')
            ->where('a.date', '>=', $now->copy()->subDay()->toDateString())
            ->get(['a.*']);

        foreach ($rows as $a) {
            $start = Carbon::parse(substr((string) $a->date, 0, 10).' '.($a->start_time ?: '00:00:00'), $tz);
            $due = $start->copy()->subMinutes((int) $a->remind_minutes);

            if ($now->lt($due)) {
                continue;
            }
            if ($now->gte($start)) { // sudah lewat: jangan kirim, cukup tandai
                if (! $dry) {
                    DB::table('event_agendas')->where('id', $a->id)->whereNull('reminded_at')->update(['reminded_at' => $now]);
                }

                continue;
            }
            // klaim dulu supaya tidak terkirim dua kali bila dua proses berjalan bersamaan
            if (! $dry && DB::table('event_agendas')->where('id', $a->id)->whereNull('reminded_at')->update(['reminded_at' => $now]) === 0) {
                continue;
            }

            $event = Event::find($a->event_id);
            if (! $event) {
                continue;
            }
            $when = $start->copy()->locale('id')->translatedFormat('l, j F Y').($a->start_time ? ' pukul '.substr((string) $a->start_time, 0, 5) : '');
            $note = new AgendaReminder($event->title, $a->title, $when, $a->location, '/events/'.($event->slug ?: $event->id));
            $list = $this->recipients($event->id);

            $this->line(($dry ? '[dry] ' : '')."Agenda #{$a->id} \"{$a->title}\" ({$event->title}): ".count($list).' penerima');
            if ($dry) {
                continue;
            }

            foreach ($list as $r) {
                try {
                    if ($r['user']) {
                        $r['user']->notify(clone $note);
                    } else {
                        Notification::route('mail', $r['email'])->notify(clone $note);
                    }
                } catch (\Throwable $e) {
                    Log::warning('Pengingat agenda gagal terkirim', ['agenda' => $a->id, 'to' => $r['email'] ?? $r['user']?->id, 'error' => $e->getMessage()]);
                }
            }
        }

        return self::SUCCESS;
    }

    /** @return array<int, array{user: ?User, email: ?string}> */
    private function recipients(int $eventId): array
    {
        $paid = fn ($q) => $q->whereNotNull('paid_at')->orWhere('total', 0);

        $ids = collect()
            ->merge(DB::table('event_registrations')->where('event_id', $eventId)->whereNotIn('status', self::CANCELLED)->pluck('user_id'))
            ->merge(DB::table('ticket_orders')->where('event_id', $eventId)->whereNotNull('user_id')->where($paid)->pluck('user_id'))
            ->merge(DB::table('tickets')->where('event_id', $eventId)->whereNotIn('status', self::CANCELLED)->pluck('user_id'))
            ->filter()->unique()->values();

        $out = [];
        $seen = [];
        foreach (User::whereIn('id', $ids)->get() as $u) {
            $out[] = ['user' => $u, 'email' => $u->email];
            if ($u->email) {
                $seen[strtolower($u->email)] = true;
            }
        }

        $guests = DB::table('ticket_orders')->where('event_id', $eventId)->whereNull('user_id')->whereNotNull('buyer_email')->where($paid)->pluck('buyer_email');
        foreach ($guests as $em) {
            $k = strtolower(trim((string) $em));
            if ($k === '' || isset($seen[$k]) || ! filter_var($k, FILTER_VALIDATE_EMAIL)) {
                continue;
            }
            $seen[$k] = true;
            $out[] = ['user' => null, 'email' => $k];
        }

        return $out;
    }
}
