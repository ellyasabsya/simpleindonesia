<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_holders', fn (Blueprint $t) => $t->string('participant_code', 24)->nullable()->index());

        // Tiket lama: orang yang sama (nama sama) dalam satu pembelian gabungan memakai satu ID (reg_code tiket pertamanya).
        $seen = [];
        $rows = DB::table('ticket_holders as h')->join('ticket_orders as o', 'o.id', '=', 'h.ticket_order_id')
            ->orderBy('h.id')->get(['h.id', 'h.reg_code', 'h.holder_name', 'o.group_code']);
        foreach ($rows as $r) {
            $key = $r->group_code ? $r->group_code.'|'.mb_strtolower(trim((string) $r->holder_name)) : null;
            $code = ($key && isset($seen[$key])) ? $seen[$key] : $r->reg_code;
            if ($key) {
                $seen[$key] = $code;
            }
            DB::table('ticket_holders')->where('id', $r->id)->update(['participant_code' => $code]);
        }
    }

    public function down(): void
    {
        Schema::table('ticket_holders', function (Blueprint $t) { $t->dropIndex(['participant_code']); $t->dropColumn('participant_code'); });
    }
};
