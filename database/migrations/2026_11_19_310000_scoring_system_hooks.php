<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scoring_system_hooks', function (Blueprint $t) {
            $t->id();
            $t->string('system_key', 30);
            $t->string('hook_key', 30);
            $t->string('label', 80);
            $t->string('description', 200)->nullable();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->boolean('is_enabled')->default(true);
            $t->timestamps();
            $t->unique(['system_key', 'hook_key']);
        });

        $rows = [
            ['juri', 'Juri', 'Kelola juri, undangan, dan link penilaian juri.'],
            ['nilai', 'Pengaturan penilaian', 'Skala, kriteria, bobot, pengurangan nilai, dan pengesahan kategori.'],
            ['publikasi', 'Publikasi', 'Publikasi hasil dan klasemen ke peserta.'],
            ['rekap', 'Rekap nilai', 'Rekap nilai, unduhan Excel, dan lembar penilaian.'],
            ['sk', 'Penetapan & SK', 'Penetapan hasil dan surat keputusan.'],
        ];
        foreach ($rows as $i => [$key, $label, $desc]) {
            DB::table('scoring_system_hooks')->insert([
                'system_key' => 'weighted', 'hook_key' => $key, 'label' => $label, 'description' => $desc,
                'sort' => $i + 1, 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('scoring_system_hooks');
    }
};
