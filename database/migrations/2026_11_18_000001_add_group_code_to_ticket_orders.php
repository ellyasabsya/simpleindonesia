<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ticket_orders', 'group_code')) {
            Schema::table('ticket_orders', function (Blueprint $table) {
                $table->string('group_code', 20)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ticket_orders', 'group_code')) {
            Schema::table('ticket_orders', function (Blueprint $table) {
                $table->dropColumn('group_code');
            });
        }
    }
};
