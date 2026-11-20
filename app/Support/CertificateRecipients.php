<?php

namespace App\Support;

use App\Models\CertificateRecipient;
use App\Models\Event;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Daftar calon penerima sertifikat satu event (induk + sub-event) dengan kunci stabil.
 * Logika yang sama dengan halaman Sertifikat Digital (Tahap 3), ditambah email dan user_id
 * untuk penerbitan dan notifikasi.
 *
 * Bentuk: ['category','key','name','code','source','email','user_id','award_title'].
 */
class CertificateRecipients
{
    private const APPROVED = ['terdaftar'];

    public static function all(Event $event): Collection
    {
        $ids = array_merge([$event->id], $event->children()->pluck('id')->all());

        return self::participants($ids)
            ->concat(self::judges($ids))
            ->concat(self::winners($ids))
            ->concat(self::manual($event))
            ->unique(fn ($r) => $r['category'].'|'.$r['key'])
            ->values();
    }

    public static function forCategory(Event $event, string $category): Collection
    {
        return self::all($event)->where('category', $category)->values();
    }

    private static function row(string $category, string $key, $name, string $code, string $source, $email = null, $userId = null, $award = null): array
    {
        return [
            'category' => $category,
            'key' => $key,
            'name' => (string) ($name ?: '-'),
            'code' => $code,
            'source' => $source,
            'email' => $email ? (string) $email : null,
            'user_id' => $userId ? (int) $userId : null,
            'award_title' => $award ? (string) $award : null,
        ];
    }

    private static function participants(array $ids): Collection
    {
        $holders = DB::table('ticket_holders as h')
            ->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->whereIn('h.event_id', $ids)
            ->where('o.status', 'lunas')
            ->whereNotNull('h.reg_code')
            ->orderBy('h.id')
            ->get(['h.reg_code', 'h.holder_name', 'h.ticket_order_id']);

        $orders = DB::table('ticket_orders')
            ->whereIn('id', $holders->pluck('ticket_order_id')->unique()->all())
            ->get()->keyBy('id');

        $tickets = $holders->map(function ($h) use ($orders) {
            $o = $orders->get($h->ticket_order_id);

            return self::row('peserta', 'ticket:'.$h->reg_code, $h->holder_name, (string) $h->reg_code, 'Tiket',
                data_get($o, 'buyer_email'), data_get($o, 'user_id'));
        });

        $regs = DB::table('event_registrations')
            ->whereIn('event_id', $ids)
            ->whereNotNull('reg_code')
            ->orderBy('id')
            ->get()
            ->filter(fn ($r) => in_array(mb_strtolower((string) $r->status), self::APPROVED, true));

        $users = DB::table('users')->whereIn('id', $regs->pluck('user_id')->filter()->all())->pluck('name', 'id');

        return $tickets->concat($regs->map(fn ($r) => self::row(
            'peserta', 'reg:'.$r->reg_code, $r->contact_name ?: ($users[$r->user_id] ?? '-'), (string) $r->reg_code,
            'Pendaftaran', $r->contact_email, $r->user_id
        )));
    }

    private static function judges(array $ids): Collection
    {
        return DB::table('judges')->whereIn('event_id', $ids)->orderBy('id')->get()->map(fn ($j) => self::row(
            'juri', 'judge:'.$j->id, data_get($j, 'name') ?: 'Juri '.$j->id,
            'JURI-'.str_pad((string) $j->id, 4, '0', STR_PAD_LEFT), 'Juri', data_get($j, 'email'), data_get($j, 'user_id')
        ));
    }

    /** Juara 1-3 dari sistem penilaian yang ada, hanya setelah dikunci/final. */
    private static function winners(array $ids): Collection
    {
        $out = collect();

        foreach ($ids as $eventId) {
            try {
                $final = DB::table('judging_overall')->where('event_id', $eventId)->whereNotNull('finalized_at')->exists();
                if (! $final) {
                    continue;
                }

                foreach (Judging::categories($eventId) as $cat) {
                    $names = collect(Judging::participants($eventId, (int) $cat['id']));
                    $place = 0;

                    foreach (Judging::ranking($eventId, (int) $cat['id']) as $row) {
                        if (++$place > 3) {
                            break;
                        }
                        $pid = data_get($row, 'id');
                        $p = $names->first(fn ($x) => (string) data_get($x, 'id') === (string) $pid);
                        $code = (string) (data_get($p, 'code') ?? data_get($row, 'code') ?? $pid);

                        $out->push(self::row(
                            'juara_'.$place, 'win:'.$eventId.':'.(int) $cat['id'].':'.$code,
                            data_get($p, 'name') ?? data_get($row, 'name') ?? '-', $code, 'Juara · '.$cat['name'],
                            data_get($p, 'email'), data_get($p, 'user_id')
                        ));
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $out;
    }

    private static function manual(Event $event): Collection
    {
        return CertificateRecipient::where('event_id', $event->id)->orderBy('id')->get()->map(fn ($m) => self::row(
            (string) $m->category, 'manual:'.$m->id, $m->name, 'MAN-'.str_pad((string) $m->id, 4, '0', STR_PAD_LEFT),
            'Manual', $m->email, $m->user_id, $m->award_title
        ));
    }
}
