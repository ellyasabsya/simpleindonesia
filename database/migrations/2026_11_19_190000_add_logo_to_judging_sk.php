<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('judging_sk') && ! Schema::hasColumn('judging_sk', 'logo_path')) {
            Schema::table('judging_sk', fn (Blueprint $t) => $t->string('logo_path')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_sk', 'logo_path')) {
            Schema::table('judging_sk', fn (Blueprint $t) => $t->dropColumn('logo_path'));
        }
    }
};
