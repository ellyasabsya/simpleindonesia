<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_types', fn (Blueprint $t) => $t->unsignedBigInteger('participant_category_id')->nullable()->index());

        foreach (DB::table('events')->where('registration_method', 'ticket')->pluck('id') as $eid) {
            $cats = DB::table('event_participant_categories')->where('event_id', $eid)->orderBy('id')->get();
            $types = DB::table('ticket_types')->where('event_id', $eid)->get();
            if ($cats->count() < 2 || $types->count() !== 1) {
                continue;
            }
            $t = $types->first();
            if ($t->name !== 'Pendaftaran' || ($t->audience ?? 'peserta') !== 'peserta') {
                continue;
            }
            $used = (int) DB::table('ticket_orders')->where('ticket_type_id', $t->id)->where('status', '!=', 'batal')->sum('quantity');
            foreach ($cats as $i => $c) {
                $row = (array) $t;
                unset($row['id']);
                $row['name'] = mb_substr('Pendaftaran Peserta Lomba - '.$c->name, 0, 60);
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

    public function down(): void
    {
        Schema::table('ticket_types', fn (Blueprint $t) => $t->dropColumn('participant_category_id'));
    }
};
