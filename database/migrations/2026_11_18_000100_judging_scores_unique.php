<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('judging_scores', 'id')) {
            DB::statement('DELETE FROM judging_scores WHERE id NOT IN (SELECT keep_id FROM (SELECT MAX(id) AS keep_id FROM judging_scores GROUP BY judge_id, registration_id, criterion_id) t)');
        }
        Schema::table('judging_scores', fn ($t) => $t->unique(['judge_id', 'registration_id', 'criterion_id'], 'judging_scores_unique_cell'));
    }

    public function down(): void
    {
        Schema::table('judging_scores', fn ($t) => $t->dropUnique('judging_scores_unique_cell'));
    }
};
