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

    /** ID Peserta: satu akun satu kode per rangkaian. Pakai yang sudah ada, kalau belum ada buat baru. */
    public static function participantFor(int $eventId, int $userId, ?string $category = null): string
    {
        $ev = DB::table('events')->where('id', $eventId)->first(['id', 'parent_id']);
        $rootId = (int) ($ev->parent_id ?: $ev->id);
        $existing = DB::table('event_registrations as r')
            ->join('events as e', 'e.id', '=', 'r.event_id')
            ->where('r.user_id', $userId)
            ->where(fn ($q) => $q->where('e.id', $rootId)->orWhere('e.parent_id', $rootId))
            ->whereNotNull('r.participant_code')
            ->orderBy('r.id')->value('r.participant_code');

        return $existing ?: self::make($eventId, $category);
    }

    /** Tiket: pakai ID peserta lama untuk akun pembeli + nama pemegang yang sama di seluruh rangkaian. */
    public static function existingTicketCode(int $eventId, ?string $email, string $holderName): ?string
    {
        $name = mb_strtolower(trim($holderName));
        $email = mb_strtolower(trim((string) $email));
        if ($email === '' || $name === '') {
            return null;
        }
        $ev = DB::table('events')->where('id', $eventId)->first(['id', 'parent_id']);
        $rootId = (int) ($ev->parent_id ?: $ev->id);

        return DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->join('events as e', 'e.id', '=', 'o.event_id')
            ->whereRaw('LOWER(TRIM(o.buyer_email)) = ?', [$email])
            ->where(fn ($q) => $q->where('e.id', $rootId)->orWhere('e.parent_id', $rootId))
            ->whereRaw('LOWER(TRIM(h.holder_name)) = ?', [$name])
            ->whereNotNull('h.participant_code')
            ->orderBy('h.id')->value('h.participant_code') ?: null;
    }

    /** Nama pemegang yang sudah punya tiket aktif (email pembeli sama) di kegiatan ini, atau kembar di pesanan yang sama. Null kalau aman. */
    public static function duplicateTicketHolder(int $eventId, string $email, array $names, ?string $audience = null): ?string
    {
        if ($audience !== null && $audience !== 'peserta') {
            return null;
        }
        $norm = [];
        foreach ($names as $n) {
            $k = mb_strtolower(trim((string) $n));
            if ($k === '') {
                continue;
            }
            if (isset($norm[$k])) {
                return trim((string) $n);
            }
            $norm[$k] = trim((string) $n);
        }
        $email = mb_strtolower(trim($email));
        if ($email === '' || ! $norm) {
            return null;
        }
        $orders = DB::table('ticket_orders')
            ->where('event_id', $eventId)
            ->whereIn('status', ['lunas', 'menunggu_verifikasi', 'menunggu'])
            ->whereRaw('LOWER(TRIM(buyer_email)) = ?', [$email])
            ->pluck('holders');
        foreach ($orders as $json) {
            foreach ((array) json_decode((string) $json, true) as $h) {
                $k = mb_strtolower(trim((string) $h));
                if (isset($norm[$k])) {
                    return $norm[$k];
                }
            }
        }

        return null;
    }

    /** ID Registrasi: ID Peserta + nomor sub-event, contoh BB-UMUM-2026-001-E1. Unik per pendaftaran. */
    public static function regCode(string $participantCode, int $eventId): string
    {
        $n = (int) (DB::table('events')->where('id', $eventId)->value('sub_order') ?: 1);
        $base = "$participantCode-E$n";
        $code = $base;
        for ($i = 2; DB::table('event_registrations')->where('reg_code', $code)->exists() || DB::table('ticket_holders')->where('reg_code', $code)->exists(); $i++) {
            $code = $base.'-'.$i;
        }

        return $code;
    }

    /** Isi participant_code dan reg_code untuk satu pendaftar form. */
    public static function assign(int $registrationId): void
    {
        $r = DB::table('event_registrations')->where('id', $registrationId)->first(['id', 'event_id', 'user_id', 'participant_category_id']);
        if (! $r) {
            return;
        }
        $cat = null;
        if ($r->participant_category_id) {
            $cat = collect(Judging::categories((int) $r->event_id))->firstWhere('id', (int) $r->participant_category_id)['name'] ?? null;
        }
        $pc = self::participantFor((int) $r->event_id, (int) $r->user_id, $cat);
        DB::table('event_registrations')->where('id', $r->id)->update(['participant_code' => $pc, 'reg_code' => self::regCode($pc, (int) $r->event_id)]);
    }
}
