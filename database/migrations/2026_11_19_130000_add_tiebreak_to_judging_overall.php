<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('judging_overall') && ! Schema::hasColumn('judging_overall', 'tiebreak_json')) {
            Schema::table('judging_overall', function (Blueprint $t) {
                $t->text('tiebreak_json')->nullable()->after('winner_count');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_overall', 'tiebreak_json')) {
            Schema::table('judging_overall', function (Blueprint $t) {
                $t->dropColumn('tiebreak_json');
            });
        }
    }
};
