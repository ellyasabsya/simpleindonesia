<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('judging_overall') && ! Schema::hasColumn('judging_overall', 'saved_at')) {
            Schema::table('judging_overall', function (Blueprint $t) {
                $t->timestamp('saved_at')->nullable();
                $t->string('saved_by', 120)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_overall', 'saved_at')) {
            Schema::table('judging_overall', function (Blueprint $t) {
                $t->dropColumn(['saved_at', 'saved_by']);
            });
        }
    }
};
