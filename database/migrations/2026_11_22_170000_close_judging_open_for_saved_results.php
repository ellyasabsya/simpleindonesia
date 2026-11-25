<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hasil yang sudah disimpan atau ditetapkan: saklar form juri harus tertutup.
        DB::table('judging_settings')
            ->where(fn ($q) => $q->whereNotNull('saved_at')->orWhereNotNull('finalized_at'))
            ->update(['judging_open' => 0]);
    }

    public function down(): void
    {
        // Tidak ada yang dikembalikan: status saklar lama tidak bisa dipulihkan.
    }
};
