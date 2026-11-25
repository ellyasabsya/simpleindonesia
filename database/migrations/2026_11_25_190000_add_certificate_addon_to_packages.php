<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->unsignedBigInteger('certificate_addon_price')->nullable()->after('judge_addon_price');
        });

        // add-on tambah juri dihentikan
        DB::table('packages')->update(['judge_addon_price' => null]);
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('certificate_addon_price');
        });
    }
};
