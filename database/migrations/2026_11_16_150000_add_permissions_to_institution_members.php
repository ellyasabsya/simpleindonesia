<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('institution_members', 'permissions')) {
            Schema::table('institution_members', fn ($t) => $t->text('permissions')->nullable());
        }
    }

    public function down(): void {}
};
