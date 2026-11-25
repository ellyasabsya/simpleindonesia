<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('judging_settings', function (Blueprint $table) {
            $table->boolean('judging_open')->default(false)->after('enabled');
        });
        // Kategori yang sudah disahkan sebelum fitur ini tetap terbuka untuk juri.
        DB::table('judging_settings')->where('enabled', 1)->update(['judging_open' => 1]);
    }

    public function down(): void
    {
        Schema::table('judging_settings', function (Blueprint $table) {
            $table->dropColumn('judging_open');
        });
    }
};
