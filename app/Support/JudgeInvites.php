<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class JudgeInvites
{
    /** Undangan juri yang menunggu untuk satu akun, bentuknya sama dengan undangan di dashboard. */
    public static function forUser(int $userId): array
    {
        return DB::table('judge_invitations')->where('user_id', $userId)->where('status', 'menunggu')->orderByDesc('id')->get()
            ->map(function ($i) {
                $title = DB::table('events')->where('id', $i->event_id)->value('title');

                return [
                    'id' => 'juri-'.$i->id,
                    'member_id' => (int) $i->id,
                    'kind' => 'juri',
                    'from' => $title ?: 'Lomba',
                    'title' => 'Diundang menjadi juri',
                    'date' => \Illuminate\Support\Carbon::parse($i->created_at)->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString(),
                ];
            })->values()->all();
    }
}
