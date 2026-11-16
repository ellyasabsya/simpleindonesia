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
            $table->unsignedInteger('judge_addon_price')->nullable();
        });
        DB::table('packages')->where('slug', 'starter')->update([
            'assessment_addon_price' => 250000,
            'judge_addon_price' => 100000,
        ]);
    }

    public function down(): void
    {
        DB::table('packages')->where('slug', 'starter')->update(['assessment_addon_price' => 300000]);
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('judge_addon_price');
        });
    }
};
