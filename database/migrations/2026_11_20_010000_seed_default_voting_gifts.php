<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public const DEFAULTS = [
        ['emoji' => '🔥', 'name' => 'Api', 'votes' => 10],
        ['emoji' => '🐻', 'name' => 'Beruang', 'votes' => 20],
        ['emoji' => '🚀', 'name' => 'Roket', 'votes' => 50],
        ['emoji' => '🦁', 'name' => 'Singa', 'votes' => 100],
    ];

    public function up(): void
    {
        $ids = DB::table('voting_gifts')->pluck('event_id');
        if (Schema::hasTable('voting_settings') && Schema::hasColumn('voting_settings', 'event_id')) {
            $ids = $ids->merge(DB::table('voting_settings')->pluck('event_id'));
        }

        foreach ($ids->unique() as $eventId) {
            $price = 1000;
            if (Schema::hasTable('voting_settings') && Schema::hasColumn('voting_settings', 'price')) {
                $price = (int) (DB::table('voting_settings')->where('event_id', $eventId)->value('price') ?: 1000);
            }
            foreach (self::DEFAULTS as $g) {
                $exists = DB::table('voting_gifts')->where('event_id', $eventId)->where('name', $g['name'])->exists();
                if ($exists) {
                    continue;
                }
                DB::table('voting_gifts')->insert([
                    'event_id' => $eventId,
                    'emoji' => $g['emoji'],
                    'name' => $g['name'],
                    'votes' => $g['votes'],
                    'price' => $g['votes'] * $price,
                    'active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Data bawaan tidak dihapus agar gift buatan lembaga tidak ikut hilang.
    }
};
