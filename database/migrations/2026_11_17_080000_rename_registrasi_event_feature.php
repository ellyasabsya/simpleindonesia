<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->swap('registrasi_event', 'registrasi_peserta');
    }

    public function down(): void
    {
        $this->swap('registrasi_peserta', 'registrasi_event');
    }

    private function swap(string $from, string $to): void
    {
        foreach (DB::table('packages')->get(['id', 'features']) as $p) {
            if ($p->features && str_contains($p->features, "\"$from\"")) {
                DB::table('packages')->where('id', $p->id)
                    ->update(['features' => str_replace("\"$from\"", "\"$to\"", $p->features)]);
            }
        }
        foreach (DB::table('events')->whereNotNull('package_snapshot')->get(['id', 'package_snapshot']) as $e) {
            if (str_contains($e->package_snapshot, "\"$from\"")) {
                DB::table('events')->where('id', $e->id)
                    ->update(['package_snapshot' => str_replace("\"$from\"", "\"$to\"", $e->package_snapshot)]);
            }
        }
    }
};
