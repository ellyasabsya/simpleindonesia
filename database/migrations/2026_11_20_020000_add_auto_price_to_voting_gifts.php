<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voting_gifts', function (Blueprint $t) {
            $t->boolean('auto_price')->default(false);
        });

        // Gift bawaan yang harganya masih sama dengan votes x harga per vote ikut otomatis.
        foreach (DB::table('voting_gifts')->whereIn('name', ['Api', 'Beruang', 'Roket', 'Singa'])->get() as $g) {
            $ppv = (int) (DB::table('voting_settings')->where('event_id', $g->event_id)->value('price_per_vote') ?: 1000);
            if ((int) $g->price === (int) $g->votes * $ppv) {
                DB::table('voting_gifts')->where('id', $g->id)->update(['auto_price' => 1]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('voting_gifts', function (Blueprint $t) {
            $t->dropColumn('auto_price');
        });
    }
};
