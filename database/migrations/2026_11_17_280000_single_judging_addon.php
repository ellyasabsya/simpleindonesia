<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Penilaian dan juri digabung jadi satu add-on "Penilaian juri" Rp350.000 di Starter. */
    public function up(): void
    {
        DB::table('packages')->where('slug', 'starter')->update(['assessment_addon_price' => 350000, 'judge_addon_price' => null]);
    }

    public function down(): void
    {
        DB::table('packages')->where('slug', 'starter')->update(['assessment_addon_price' => 250000, 'judge_addon_price' => 100000]);
    }
};
