<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** ID registrasi: KODE-KATEGORI-TAHUN-NOURUT, contoh BB-SMA-2026-001. */
class RegistrationCode
{
    /** Kategori bawaan untuk pendaftar yang tidak punya kategori (mis. pembeli tiket). */
    public const DEFAULT_CATEGORY = 'UMUM';

    public static function initials(string $title): string
    {
        $words = preg_split('/[^\p{L}]+/u', $title, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $words = array_values(array_filter(array_map(fn ($w) => Str::upper(Str::ascii($w)), $words)));
        if (count($words) >= 2) {
            return substr(implode('', array_map(fn ($w) => $w[0], $words)), 0, 4);
        }

        return substr($words[0] ?? 'EVT', 0, 3);
    }

    /** Singkatan event induk; dibuat sekali, unik, lalu disimpan. */
    public static function eventCode(int $rootId): string
    {
        $row = DB::table('events')->where('id', $rootId)->first(['id', 'title', 'code']);
        if ($row->code) {
            return $row->code;
        }
        $base = self::initials($row->title);
        $code = $base;
        $i = 2;
        while (DB::table('events')->where('code', $code)->where('id', '!=', $rootId)->exists()) {
            $code = $base.$i++;
        }
        DB::table('events')->where('id', $rootId)->update(['code' => $code]);

        return $code;
    }

    /** Buat ID baru untuk pendaftar di event (induk atau sub-event) dengan nama kategori tertentu. */
    public static function make(int $eventId, ?string $category = null): string
    {
        $ev = DB::table('events')->where('id', $eventId)->first(['id', 'parent_id']);
        $rootId = $ev->parent_id ?: $ev->id;
        $root = DB::table('events')->where('id', $rootId)->first(['starts_at']);

        $code = self::eventCode($rootId);
        $year = Carbon::parse($root->starts_at)->format('Y');
        $cat = Str::upper(preg_replace('/[^A-Za-z0-9]+/', '', Str::ascii((string) $category))) ?: self::DEFAULT_CATEGORY;
        $prefix = "$code-$cat-$year";

        return DB::transaction(function () use ($prefix) {
            DB::table('registration_counters')->insertOrIgnore(['prefix' => $prefix, 'last' => 0]);
            DB::table('registration_counters')->where('prefix', $prefix)->increment('last');
            $n = (int) DB::table('registration_counters')->where('prefix', $prefix)->value('last');

            return $prefix.'-'.str_pad((string) $n, 3, '0', STR_PAD_LEFT);
        });
    }
}
