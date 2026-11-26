<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TicketScanController extends Controller
{
    /** Status pendaftaran transfer yang boleh check-in. Cek isinya: select status, count(*) from event_registrations group by status. */
    private const APPROVED = ['terdaftar', 'disetujui', 'lunas'];

    public function store(Request $request, Event $event): JsonResponse
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);

        $code = $this->extract((string) $request->input('code'));
        if ($code === '') {
            return response()->json(['status' => 'tidak_ditemukan', 'code' => '']);
        }
        $lc = mb_strtolower($code);
        $by = $request->user()?->id;
        $confirm = $request->boolean('confirm');

        $scope = $event->parent_id === null
            ? array_merge([$event->id], $event->children()->pluck('id')->all())
            : [$event->id];

        // 1. Tiket (pengunjung atau peserta lewat tiket)
        $h = DB::table('ticket_holders')
            ->whereIn('event_id', $scope)
            ->where(function ($q) use ($lc) {
                $q->whereRaw('LOWER(code) = ?', [$lc])->orWhereRaw('LOWER(reg_code) = ?', [$lc])->orWhereRaw('LOWER(participant_code) = ?', [$lc]);
            })
            ->first();
        if ($h) {
            return $this->byTicket($h, $scope, $by);
        }

        // 1b. ID tim (pendaftaran tim)
        if (\App\Support\TeamCodes::ready()) {
            $tm = DB::table('registration_teams as t')
                ->join('event_registrations as r', 'r.id', '=', 't.event_registration_id')
                ->whereIn('r.event_id', $scope)
                ->whereRaw('LOWER(t.team_code) = ?', [$lc])
                ->first(['t.*']);
            if ($tm) {
                return $this->byTeam($tm, 'kode', $by);
            }
        }

        // 2. ID peserta pendaftaran transfer (diketik atau alat scan USB)
        $reg = DB::table('event_registrations')
            ->whereIn('event_id', $scope)
            ->where(function ($q) use ($lc) {
                $q->whereRaw('LOWER(reg_code) = ?', [$lc])->orWhereRaw('LOWER(participant_code) = ?', [$lc]);
            })
            ->first();
        if ($reg) {
            return $this->byRegistration($reg, 'kode', $by, $confirm);
        }

        // 3. QR akun (/u/username atau /u/id): panitia harus mengonfirmasi dulu
        $user = $this->findUser($code);
        if ($user) {
            $regs = DB::table('event_registrations')->whereIn('event_id', $scope)->where('user_id', $user->id)->get();
            if ($regs->isEmpty()) {
                return response()->json(['status' => 'bukan_peserta', 'code' => $code, 'name' => $user->name]);
            }
            $reg = $regs->first(fn ($r) => in_array($r->status, self::APPROVED, true) && ! $this->regDoneToday($r)) ?? $regs->first();
            $ready = in_array($reg->status, self::APPROVED, true) && ! $this->regDoneToday($reg);
            if ($ready && ! $confirm) {
                return response()->json($this->infoReg($reg) + ['status' => 'konfirmasi']);
            }
            return $this->byRegistration($reg, 'qr_akun', $by, $confirm);
        }

        return response()->json(['status' => 'tidak_ditemukan', 'code' => $code]);
    }

    private function byTicket(object $h, array $scope, ?int $by): JsonResponse
    {
        $order = DB::table('ticket_orders')->where('id', $h->ticket_order_id)->first();
        $type = $h->ticket_type_id ? DB::table('ticket_types')->where('id', $h->ticket_type_id)->first(['name', 'audience', 'valid_days']) : null;
        $kind = ($type->audience ?? 'peserta') === 'umum' ? 'pengunjung' : 'peserta';
        $userId = data_get($order, 'user_id');
        $also = $kind === 'pengunjung' && $userId
            && DB::table('event_registrations')->whereIn('event_id', $scope)->where('user_id', $userId)->whereIn('status', self::APPROVED)->exists();

        $info = [
            'kind' => $kind,
            'also_participant' => $also,
            'code' => $h->code,
            'reg_id' => $h->participant_code ?: $h->reg_code,
            'name' => $h->holder_name,
            'type' => $type->name ?? null,
            'buyer' => data_get($order, 'buyer_name') ?? data_get($order, 'name') ?? data_get($order, 'buyer_email'),
        ];

        if (! $order || $order->status !== 'lunas') {
            return response()->json($info + ['status' => 'belum_lunas', 'order_status' => $order->status ?? null]);
        }

        // Tiket dengan tanggal kunjungan hanya sah di tanggal itu.
        $vdate = $h->visit_date ?? DB::table('ticket_holders')->where('id', $h->id)->value('visit_date');
        if ($vdate && substr((string) $vdate, 0, 10) !== now(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString()) {
            return response()->json($info + ['status' => 'salah_tanggal', 'visit_date' => substr((string) $vdate, 0, 10)]);
        }

        // Check-in harian: sekali per hari. Tiket tanpa tanggal kunjungan hanya sah di dalam masa berlakunya.
        if (! $vdate && ($bad = $this->outOfSpan($this->ticketSpan((int) $h->event_id, $kind, $type->valid_days ?? null)))) {
            return response()->json($info + $bad);
        }

        [$st, $at] = $this->claimDaily('ticket', 'ticket_holders', (int) $h->id, $by);

        if ($st === 'ok') {
            $this->logSafe($h->event_id, $kind, 'ticket_holder', $h->id, 'tiket', $by);
            return response()->json($info + ['status' => 'ok', 'at' => $this->fmt($at)]);
        }

        return response()->json($info + ['status' => 'duplikat', 'at' => $this->fmt($at)]);
    }

    private function byRegistration(object $r, string $method, ?int $by, bool $confirm = false): JsonResponse
    {
        $info = $this->infoReg($r);

        if (! in_array($r->status, self::APPROVED, true)) {
            return response()->json($info + ['status' => 'belum_disetujui', 'order_status' => $r->status]);
        }

        if ($teams = $this->teamsOf($r)) {
            return $this->byTeams($r, $teams, $method, $by, $confirm, $info);
        }

        if ($bad = $this->outOfSpan($this->eventSpan((int) $r->event_id))) {
            return response()->json($info + $bad);
        }

        [$st, $at] = $this->claimDaily('registration', 'event_registrations', (int) $r->id, $by);

        if ($st === 'ok') {
            $this->logSafe($r->event_id, 'peserta', 'registration', $r->id, $method, $by);
            return response()->json($info + ['status' => 'ok', 'at' => $this->fmt($at)]);
        }

        return response()->json($info + ['status' => 'duplikat', 'at' => $this->fmt($at)]);
    }

    private function teamsOf(object $r): ?\Illuminate\Support\Collection
    {
        if (! \App\Support\TeamCodes::ready()) {
            return null;
        }
        \App\Support\TeamCodes::ensure([$r->id]);
        $rows = DB::table('registration_teams')->where('event_registration_id', $r->id)->orderBy('id')->get();

        return $rows->isEmpty() ? null : $rows;
    }

    /** Pendaftar membawa satu atau beberapa tim: satu tim langsung, beberapa tim minta konfirmasi lalu semuanya masuk. Check-in harian. */
    private function byTeams(object $r, $teams, string $method, ?int $by, bool $confirm, array $info): JsonResponse
    {
        if ($teams->count() === 1) {
            return $this->byTeam($teams->first(), $method, $by);
        }
        if ($bad = $this->outOfSpan($this->eventSpan((int) $r->event_id))) {
            return response()->json(array_merge($info, ['type' => $teams->count().' tim'], $bad));
        }
        $label = $teams->count().' tim: '.$teams->pluck('name')->implode(', ');
        $done = DB::table('daily_checkins')->where('holder_type', 'team')->where('visit_date', $this->today())
            ->whereIn('holder_id', $teams->pluck('id')->all())->pluck('checked_in_at', 'holder_id');
        $pending = $teams->filter(fn ($t) => ! isset($done[$t->id]) && ! $this->isToday($t->checked_in_at));

        if ($pending->isEmpty()) {
            $prev = $done->filter()->sort()->first() ?? $teams->pluck('checked_in_at')->filter()->sort()->first();

            return response()->json(array_merge($info, ['type' => $label, 'status' => 'duplikat', 'at' => $this->fmt($prev)]));
        }
        if (! $confirm) {
            return response()->json(array_merge($info, ['type' => $label.' (belum hadir: '.$pending->count().')', 'status' => 'konfirmasi']));
        }

        $codes = [];
        foreach ($pending as $t) {
            [$st] = $this->claimDaily('team', 'registration_teams', (int) $t->id, $by);
            if ($st === 'ok') {
                $this->logSafe($r->event_id, 'peserta', 'team', $t->id, $method, $by);
                $codes[] = $t->team_code;
            }
        }
        DB::table('event_registrations')->where('id', $r->id)->whereNull('checked_in_at')->update(['checked_in_at' => now(), 'checked_in_by' => $by]);

        return response()->json(array_merge($info, ['type' => $label, 'status' => 'ok', 'at' => $this->fmt(now()), 'codes' => $codes]));
    }

    private function byTeam(object $t, string $method, ?int $by): JsonResponse
    {
        $r = DB::table('event_registrations')->where('id', $t->event_registration_id)->first();
        $cat = $t->participant_category_id ? DB::table('event_participant_categories')->where('id', $t->participant_category_id)->value('name') : null;
        $base = $this->infoReg($r);
        $info = array_merge($base, ['code' => $t->team_code, 'reg_id' => $t->team_code, 'name' => $t->name, 'type' => $cat ?: ($base['type'] ?? null)]);

        if (! in_array($r->status, self::APPROVED, true)) {
            return response()->json($info + ['status' => 'belum_disetujui', 'order_status' => $r->status]);
        }
        if ($bad = $this->outOfSpan($this->eventSpan((int) $r->event_id))) {
            return response()->json($info + $bad);
        }

        [$st, $at] = $this->claimDaily('team', 'registration_teams', (int) $t->id, $by);
        DB::table('event_registrations')->where('id', $r->id)->whereNull('checked_in_at')->update(['checked_in_at' => now(), 'checked_in_by' => $by]);

        if ($st === 'ok') {
            $this->logSafe($r->event_id, 'peserta', 'team', $t->id, $method, $by);

            return response()->json($info + ['status' => 'ok', 'at' => $this->fmt($at)]);
        }

        return response()->json($info + ['status' => 'duplikat', 'at' => $this->fmt($at)]);
    }

    // ---- Check-in harian (dipakai semua jalur) ----

    private function today(): string
    {
        return now(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString();
    }

    private function isToday($ts): bool
    {
        if (! $ts) {
            return false;
        }

        return \Illuminate\Support\Carbon::parse($ts)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString() === $this->today();
    }

    /** Pendaftar (atau salah satu timnya) sudah check-in hari ini? Data lama (sebelum daftar harian) ikut dihitung. */
    private function regDoneToday(object $r): bool
    {
        if ($this->isToday($r->checked_in_at ?? null)) {
            return true;
        }
        $today = $this->today();
        if (DB::table('daily_checkins')->where('holder_type', 'registration')->where('holder_id', $r->id)->where('visit_date', $today)->exists()) {
            return true;
        }
        if (! \Illuminate\Support\Facades\Schema::hasTable('registration_teams')) {
            return false;
        }

        return DB::table('daily_checkins')->where('holder_type', 'team')->where('visit_date', $today)
            ->whereIn('holder_id', DB::table('registration_teams')->where('event_registration_id', $r->id)->pluck('id')->all())
            ->exists();
    }

    /** Satu baris per (jenis, id, tanggal). 'ok' hanya untuk scan pertama hari ini. Mengembalikan [status, waktu]. */
    private function claimDaily(string $kind, string $table, int $id, ?int $by): array
    {
        $today = $this->today();
        $now = now();
        $made = DB::table('daily_checkins')->insertOrIgnore([
            'holder_type' => $kind, 'holder_id' => $id, 'visit_date' => $today,
            'checked_in_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $row = fn () => DB::table('daily_checkins')->where('holder_type', $kind)->where('holder_id', $id)->where('visit_date', $today);

        if (! $made) {
            return ['duplikat', $row()->value('checked_in_at')];
        }

        $first = DB::table($table)->where('id', $id)->value('checked_in_at');
        if ($first && $this->isToday($first)) {
            // Sudah check-in hari ini sebelum check-in harian ada.
            $row()->update(['checked_in_at' => $first]);

            return ['duplikat', $first];
        }

        DB::table($table)->where('id', $id)->whereNull('checked_in_at')->update(['checked_in_at' => $now, 'checked_in_by' => $by]);

        return ['ok', $now];
    }

    /** Pencatatan log tidak boleh menggagalkan check-in. */
    private function logSafe(...$args): void
    {
        try {
            $this->log(...$args);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Rentang tanggal event [mulai, selesai] (Y-m-d). Null kalau tanggal event tidak ada. */
    private function eventSpan(int $eventId): ?array
    {
        $e = DB::table('events')->where('id', $eventId)->first(['starts_at', 'ends_at']);
        if (! $e || ! $e->starts_at) {
            return null;
        }
        $a = substr((string) $e->starts_at, 0, 10);

        return [$a, $e->ends_at ? substr((string) $e->ends_at, 0, 10) : $a];
    }

    /** Tiket pengunjung terusan: mulai event + valid_days. Selain itu: selama kegiatan. */
    private function ticketSpan(int $eventId, string $kind, $validDays): ?array
    {
        $span = $this->eventSpan($eventId);
        if (! $span) {
            return null;
        }
        if ($kind === 'pengunjung' && (int) $validDays >= 1) {
            return [$span[0], \Illuminate\Support\Carbon::parse($span[0])->addDays((int) $validDays - 1)->toDateString()];
        }

        return $span;
    }

    private function outOfSpan(?array $span): ?array
    {
        if (! $span) {
            return null;
        }
        $t = $this->today();
        if ($t >= $span[0] && $t <= $span[1]) {
            return null;
        }

        return ['status' => 'salah_tanggal', 'visit_date' => $span[0], 'valid_to' => $span[1]];
    }

    private function infoReg(object $r): array
    {
        $cat = $r->participant_category_id && Schema::hasColumn('event_participant_categories', 'name')
            ? DB::table('event_participant_categories')->where('id', $r->participant_category_id)->value('name')
            : null;

        return [
            'kind' => 'peserta',
            'code' => $r->reg_code ?? '',
            'reg_id' => $r->participant_code ?: $r->reg_code,
            'name' => $r->contact_name ?: (DB::table('users')->where('id', $r->user_id)->value('name') ?? '-'),
            'type' => $cat,
            'school' => $r->school,
        ];
    }

    private function findUser(string $code): ?object
    {
        $q = DB::table('users');
        $hasUsername = Schema::hasColumn('users', 'username');
        if ($hasUsername && ctype_digit($code)) {
            return $q->where(fn ($w) => $w->whereRaw('LOWER(username) = ?', [mb_strtolower($code)])->orWhere('id', (int) $code))->first();
        }
        if ($hasUsername) {
            return $q->whereRaw('LOWER(username) = ?', [mb_strtolower($code)])->first();
        }
        return ctype_digit($code) ? $q->where('id', (int) $code)->first() : null;
    }

    private function log(int $eventId, string $kind, string $source, int $sourceId, string $method, ?int $by): void
    {
        DB::table('checkins')->insertOrIgnore([
            'event_id' => $eventId, 'kind' => $kind, 'source' => $source, 'source_id' => $sourceId,
            'visit_date' => $this->today(), 'method' => $method, 'scanned_by' => $by, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function extract(string $raw): string
    {
        $raw = trim($raw);
        if (str_contains($raw, '/')) {
            $path = parse_url($raw, PHP_URL_PATH) ?: $raw;
            $parts = array_values(array_filter(explode('/', $path), fn ($p) => $p !== ''));
            $raw = $parts ? end($parts) : '';
        }
        return trim(explode('?', $raw)[0]);
    }

    private function fmt($value): string
    {
        return Carbon::parse($value)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('d M Y H:i');
    }
}
