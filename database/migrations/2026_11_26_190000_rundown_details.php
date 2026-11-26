<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('event_rundown_items') && ! Schema::hasColumn('event_rundown_items', 'details')) {
            Schema::table('event_rundown_items', function (Blueprint $t) {
                $t->text('details')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('event_rundown_items', 'details')) {
            Schema::table('event_rundown_items', function (Blueprint $t) {
                $t->dropColumn('details');
            });
        }
    }
};
