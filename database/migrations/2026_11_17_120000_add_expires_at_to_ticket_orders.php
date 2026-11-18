<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dateTime('expires_at')->nullable()->after('status');
            $t->index(['ticket_type_id', 'status'], 'ticket_orders_type_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dropIndex('ticket_orders_type_status_idx');
            $t->dropColumn('expires_at');
        });
    }
};
