<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Status "sudah digunakan" untuk tiket yang bisa check-in tiap hari. */
class DailyUse
{
    public static function today(): string
    {
        return now(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString();
    }

    /** id tiket yang sudah check-in hari ini, sebagai [id => index] supaya cepat dicek dengan isset. */
    public static function todayIds(array $ids): array
    {
        if (! $ids) {
            return [];
        }

        return array_flip(DB::table('daily_checkins')->where('holder_type', 'ticket')
            ->where('visit_date', self::today())->whereIn('holder_id', $ids)->pluck('holder_id')->all());
    }

    private static array $todaySet = [];
    private static bool $todayLoaded = false;

    /** Sudah check-in hari ini? Dari daily_checkins, plus data lama yang checked_in_at-nya hari ini. */
    public static function doneToday(string $type, int $id, $checkedInAt = null): bool
    {
        if (! self::$todayLoaded) {
            foreach (DB::table('daily_checkins')->where('visit_date', self::today())->get(['holder_type', 'holder_id']) as $r) {
                self::$todaySet[$r->holder_type][(int) $r->holder_id] = true;
            }
            self::$todayLoaded = true;
        }
        if (isset(self::$todaySet[$type][$id])) {
            return true;
        }

        return $checkedInAt
            && Carbon::parse($checkedInAt)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString() === self::today();
    }

    public static function used(object $h, $endsAt = null, ?array $todayIds = null): bool
    {
        if (! ($h->checked_in_at ?? null)) {
            return false;
        }
        // Tiket sehari: pernah check-in berarti sudah dipakai.
        if (! empty($h->visit_date)) {
            return true;
        }
        $tz = config('app.agenda_timezone', 'Asia/Jakarta');
        $today = self::today();
        // Event sudah berakhir: tampilkan "pernah check-in".
        if ($endsAt && substr((string) $endsAt, 0, 10) < $today) {
            return true;
        }
        if (Carbon::parse($h->checked_in_at)->setTimezone($tz)->toDateString() === $today) {
            return true;
        }
        $id = $h->id ?? null;
        if (! $id) {
            return false;
        }
        if ($todayIds !== null) {
            return isset($todayIds[$id]);
        }

        return DB::table('daily_checkins')->where('holder_type', 'ticket')->where('holder_id', $id)
            ->where('visit_date', $today)->exists();
    }
}
