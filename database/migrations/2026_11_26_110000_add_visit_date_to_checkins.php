<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('checkins', 'visit_date')) {
            return;
        }

        Schema::table('checkins', function (Blueprint $t) {
            $t->date('visit_date')->nullable()->after('source_id');
        });

        // Data lama: tanggal dari created_at, dalam zona waktu agenda.
        $tz = config('app.agenda_timezone', 'Asia/Jakarta');
        DB::table('checkins')->orderBy('id')->chunkById(500, function ($rows) use ($tz) {
            foreach ($rows as $r) {
                DB::table('checkins')->where('id', $r->id)->update([
                    'visit_date' => \Illuminate\Support\Carbon::parse($r->created_at)->setTimezone($tz)->toDateString(),
                ]);
            }
        });

        Schema::table('checkins', function (Blueprint $t) {
            $t->dropUnique('checkins_source_source_id_unique');
            $t->unique(['source', 'source_id', 'visit_date'], 'checkins_source_source_id_date_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('checkins', 'visit_date')) {
            return;
        }
        Schema::table('checkins', function (Blueprint $t) {
            $t->dropUnique('checkins_source_source_id_date_unique');
        });
        // Kembali ke satu baris per sumber: simpan yang paling awal.
        DB::statement('DELETE FROM checkins WHERE id NOT IN (SELECT id FROM (SELECT MIN(id) AS id FROM checkins GROUP BY source, source_id) x)');
        Schema::table('checkins', function (Blueprint $t) {
            $t->unique(['source', 'source_id'], 'checkins_source_source_id_unique');
            $t->dropColumn('visit_date');
        });
    }
};
