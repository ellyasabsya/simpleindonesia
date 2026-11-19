<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scoring_systems', function (Blueprint $t) {
            $t->id();
            $t->string('system_key', 30)->unique();
            $t->string('name', 120);
            $t->text('description')->nullable();
            $t->string('tag', 60)->nullable();
            $t->unsignedSmallInteger('version')->default(1);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        DB::table('scoring_systems')->insert([
            'system_key' => 'weighted',
            'name' => 'Penilaian Berbasis Bobot Nilai',
            'description' => 'Nilai akhir dari jumlah (nilai × bobot) tiap kriteria, dinilai beberapa juri. Cocok untuk lomba seni, vokal, tari, dan sejenisnya.',
            'tag' => 'Weighted · Bobot',
            'version' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('scoring_systems');
    }
};
