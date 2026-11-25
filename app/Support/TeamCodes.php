<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** ID tim: ID Registrasi pendaftar + nomor urut tim, contoh BB-SMA-2026-001-E1-T1. */
class TeamCodes
{
    /** Kolom tim sudah ada di database (SQL/migrasi sudah dijalankan). */
    public static function ready(): bool
    {
        return Schema::hasTable('registration_teams') && Schema::hasColumn('registration_teams', 'team_code');
    }

    /** Beri kode untuk tim yang belum punya, urut berdasarkan id tim. Pendaftar tanpa reg_code dilewati. */
    public static function ensure(array $registrationIds): void
    {
        if (! self::ready() || ! $registrationIds) {
            return;
        }
        $regs = DB::table('event_registrations')->whereIn('id', $registrationIds)->whereNotNull('reg_code')->pluck('reg_code', 'id');
        $teams = DB::table('registration_teams')->whereIn('event_registration_id', $regs->keys()->all())->orderBy('id')->get(['id', 'event_registration_id', 'team_code'])->groupBy('event_registration_id');

        foreach ($teams as $regId => $rows) {
            if ($rows->every(fn ($t) => $t->team_code)) {
                continue;
            }
            $used = $rows->pluck('team_code')->filter()->all();
            $n = 0;
            foreach ($rows as $t) {
                $n++;
                if ($t->team_code) {
                    continue;
                }
                $code = $regs[$regId].'-T'.$n;
                while (in_array($code, $used, true)) {
                    $n++;
                    $code = $regs[$regId].'-T'.$n;
                }
                $used[] = $code;
                DB::table('registration_teams')->where('id', $t->id)->update(['team_code' => $code]);
            }
        }
    }
}
