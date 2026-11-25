<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class TicketCategories
{
    /**
     * Jika event punya 2 kategori peserta atau lebih dan satu jenis tiket pendaftaran
     * belum terikat kategori, pecah jadi satu jenis tiket per kategori.
     * Aman dipanggil berulang: tiket yang sudah punya kategori tidak disentuh.
     */
    public static function split(int $eventId): void
    {
        $cats = DB::table('event_participant_categories')->where('event_id', $eventId)->orderBy('id')->get();
        if ($cats->count() < 2) {
            return;
        }

        $open = DB::table('ticket_types')->where('event_id', $eventId)->whereNull('participant_category_id')
            ->where(fn ($q) => $q->where('audience', 'peserta')->orWhereNull('audience'))
            ->where('name', 'like', 'Pendaftaran%')
            ->get();
        if ($open->count() !== 1) {
            return;
        }

        $t = $open->first();
        $used = (int) DB::table('ticket_orders')->where('ticket_type_id', $t->id)->where('status', '!=', 'batal')->sum('quantity');

        foreach ($cats as $i => $c) {
            $row = (array) $t;
            unset($row['id']);
            $row['name'] = mb_substr('Pendaftaran Peserta - '.$c->name, 0, 60);
            $row['quota'] = max((int) $c->quota, $i === 0 ? $used : 1);
            $row['max_per_order'] = 1;
            $row['participant_category_id'] = $c->id;
            $row['updated_at'] = now();
            if ($i === 0) {
                DB::table('ticket_types')->where('id', $t->id)->update($row);
            } else {
                $row['created_at'] = now();
                DB::table('ticket_types')->insert($row);
            }
        }
    }
}
