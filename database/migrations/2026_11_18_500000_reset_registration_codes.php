<?php

use App\Support\Judging;
use App\Support\RegistrationCode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_registrations', fn (Blueprint $t) => $t->string('participant_code', 24)->nullable()->index());

        if (DB::getDriverName() !== 'sqlite') {
            foreach (['event_registrations', 'ticket_holders'] as $tb) {
                Schema::table($tb, fn (Blueprint $t) => $t->string('reg_code', 40)->nullable()->change());
            }
        }

        $ev = DB::table('events')->get(['id', 'parent_id', 'sub_order'])->keyBy('id');
        $items = [];

        foreach (DB::table('event_registrations')->orderBy('id')->get(['id', 'event_id', 'user_id', 'participant_category_id', 'reg_code', 'created_at']) as $r) {
            if (str_starts_with((string) $r->reg_code, 'TES') || ! isset($ev[$r->event_id])) {
                continue;
            }
            $items[] = ['t' => 'event_registrations', 'id' => (int) $r->id, 'event' => (int) $r->event_id, 'key' => 'u'.$r->user_id, 'cat' => $r->participant_category_id, 'at' => (string) $r->created_at];
        }
        foreach (DB::table('ticket_holders as h')->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->orderBy('h.id')->get(['h.id', 'h.event_id', 'h.holder_name', 'h.reg_code', 'h.created_at', 'o.group_code']) as $h) {
            if (str_starts_with((string) $h->reg_code, 'TES') || ! isset($ev[$h->event_id])) {
                continue;
            }
            $key = $h->group_code ? 'g'.$h->group_code.'|'.mb_strtolower(trim((string) $h->holder_name)) : 'h'.$h->id;
            $items[] = ['t' => 'ticket_holders', 'id' => (int) $h->id, 'event' => (int) $h->event_id, 'key' => $key, 'cat' => null, 'at' => (string) $h->created_at];
        }
        usort($items, fn ($a, $b) => [$a['at'], $a['t'], $a['id']] <=> [$b['at'], $b['t'], $b['id']]);

        $cache = [];
        $catName = function (int $eid, $cid) use (&$cache) {
            if (! $cid) {
                return null;
            }
            $cache[$eid] ??= collect(Judging::categories($eid))->pluck('name', 'id')->all();

            return $cache[$eid][(int) $cid] ?? null;
        };

        DB::transaction(function () use ($items, $ev, $catName) {
            DB::table('registration_counters')->delete();
            $people = [];
            $used = [];
            foreach ($items as $it) {
                $rootId = (int) ($ev[$it['event']]->parent_id ?: $it['event']);
                $pk = $rootId.'|'.$it['key'];
                $people[$pk] ??= RegistrationCode::make($it['event'], $catName($it['event'], $it['cat']));
                $pc = $people[$pk];
                $base = $pc.'-E'.((int) ($ev[$it['event']]->sub_order ?: 1));
                $reg = $base;
                for ($i = 2; isset($used[$reg]); $i++) {
                    $reg = $base.'-'.$i;
                }
                $used[$reg] = true;
                DB::table($it['t'])->where('id', $it['id'])->update(['reg_code' => $reg, 'participant_code' => $pc]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('event_registrations', function (Blueprint $t) { $t->dropIndex(['participant_code']); $t->dropColumn('participant_code'); });
    }
};
