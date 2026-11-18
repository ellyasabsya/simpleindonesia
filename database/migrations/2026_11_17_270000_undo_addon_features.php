<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Cabut kunci penilaian_juri yang pernah tertulis ke snapshot, kecuali paketnya memang memuatnya. */
    public function up(): void
    {
        DB::table('events')->whereNotNull('package_snapshot')->orderBy('id')->each(function ($e) {
            $snap = json_decode((string) $e->package_snapshot, true);
            if (! is_array($snap) || ! in_array('penilaian_juri', $snap['features'] ?? [], true)) {
                return;
            }
            $opt = $snap['options'] ?? [];
            if (empty($opt['assessment_addon']) && empty($opt['judge_addon'])) {
                return;
            }
            $pkg = json_decode((string) DB::table('packages')->where('id', $e->package_id)->value('features'), true) ?: [];
            if (in_array('penilaian_juri', $pkg, true)) {
                return;
            }
            $snap['features'] = array_values(array_diff($snap['features'], ['penilaian_juri']));
            DB::table('events')->where('id', $e->id)->update(['package_snapshot' => json_encode($snap, JSON_UNESCAPED_UNICODE)]);
        });
    }

    public function down(): void {}
};
