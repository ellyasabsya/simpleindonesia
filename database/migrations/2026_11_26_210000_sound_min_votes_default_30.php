<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Pengaturan ini belum pernah dipakai penonton, jadi nilai 0 lama hanyalah nilai awal.
        DB::table('voting_settings')->where('sound_min_votes', 0)->update(['sound_min_votes' => 30]);
    }

    public function down(): void
    {
    }
};
