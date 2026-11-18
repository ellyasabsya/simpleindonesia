<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['judging_settings', 'judging_criteria', 'judges', 'judging_deductions'];

    public function up(): void
    {
        Schema::table('judging_settings', fn (Blueprint $t) => $t->dropUnique(['event_id']));

        foreach ($this->tables as $tb) {
            Schema::table($tb, fn (Blueprint $t) => $t->unsignedBigInteger('category_id')->default(0));
        }

        Schema::table('judging_settings', fn (Blueprint $t) => $t->unique(['event_id', 'category_id']));

        $cats = DB::table('event_participant_categories')->orderBy('id')->get(['id', 'event_id'])->groupBy('event_id');
        foreach ($cats as $eventId => $list) {
            $first = (int) $list->first()->id;
            foreach ($this->tables as $tb) {
                DB::table($tb)->where('event_id', $eventId)->update(['category_id' => $first]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('judging_settings', fn (Blueprint $t) => $t->dropUnique(['event_id', 'category_id']));
        foreach ($this->tables as $tb) {
            Schema::table($tb, fn (Blueprint $t) => $t->dropColumn('category_id'));
        }
        Schema::table('judging_settings', fn (Blueprint $t) => $t->unique('event_id'));
    }
};
