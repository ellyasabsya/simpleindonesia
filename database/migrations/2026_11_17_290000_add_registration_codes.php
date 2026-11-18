<?php

use App\Support\RegistrationCode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', fn (Blueprint $t) => $t->string('code', 12)->nullable()->unique());
        Schema::table('event_registrations', fn (Blueprint $t) => $t->string('reg_code', 24)->nullable()->unique());
        Schema::table('ticket_holders', fn (Blueprint $t) => $t->string('reg_code', 24)->nullable()->unique());
        Schema::create('registration_counters', function (Blueprint $t) {
            $t->string('prefix', 40)->primary();
            $t->unsignedInteger('last')->default(0);
        });

        // Pendaftar lama: berurutan menurut waktu daftar.
        foreach (DB::table('events')->whereNull('parent_id')->orderBy('id')->pluck('id') as $id) {
            RegistrationCode::eventCode($id);
        }
        $cats = DB::table('event_participant_categories')->pluck('name', 'id');

        $items = collect();
        foreach (DB::table('event_registrations')->get(['id', 'event_id', 'participant_category_id', 'created_at']) as $r) {
            $items->push(['t' => 'event_registrations', 'id' => $r->id, 'event' => $r->event_id, 'cat' => $cats[$r->participant_category_id] ?? null, 'at' => $r->created_at]);
        }
        foreach (DB::table('ticket_holders')->get(['id', 'event_id', 'created_at']) as $h) {
            $items->push(['t' => 'ticket_holders', 'id' => $h->id, 'event' => $h->event_id, 'cat' => null, 'at' => $h->created_at]);
        }
        foreach ($items->sortBy([['at', 'asc'], ['id', 'asc']]) as $it) {
            DB::table($it['t'])->where('id', $it['id'])->update(['reg_code' => RegistrationCode::make($it['event'], $it['cat'])]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_counters');
        Schema::table('ticket_holders', function (Blueprint $t) { $t->dropUnique(['reg_code']); $t->dropColumn('reg_code'); });
        Schema::table('event_registrations', function (Blueprint $t) { $t->dropUnique(['reg_code']); $t->dropColumn('reg_code'); });
        Schema::table('events', function (Blueprint $t) { $t->dropUnique(['code']); $t->dropColumn('code'); });
    }
};
