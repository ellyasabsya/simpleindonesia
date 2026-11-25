<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE judges MODIFY category_id BIGINT NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE judge_invitations MODIFY category_id BIGINT NOT NULL DEFAULT 0');
        }
    }

    public function down(): void
    {
    }
};
