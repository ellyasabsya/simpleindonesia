<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('judging_overall') && ! Schema::hasColumn('judging_overall', 'logo_path')) {
            Schema::table('judging_overall', fn (Blueprint $t) => $t->string('logo_path')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_overall', 'logo_path')) {
            Schema::table('judging_overall', fn (Blueprint $t) => $t->dropColumn('logo_path'));
        }
    }
};
