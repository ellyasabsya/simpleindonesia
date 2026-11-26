<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ticket_types', 'valid_dates')) {
            Schema::table('ticket_types', fn (Blueprint $t) => $t->json('valid_dates')->nullable());
        }
        if (! Schema::hasColumn('ticket_orders', 'visit_date')) {
            Schema::table('ticket_orders', fn (Blueprint $t) => $t->date('visit_date')->nullable());
        }
        if (! Schema::hasColumn('ticket_holders', 'visit_date')) {
            Schema::table('ticket_holders', fn (Blueprint $t) => $t->date('visit_date')->nullable());
        }
    }

    public function down(): void
    {
        Schema::table('ticket_holders', fn (Blueprint $t) => $t->dropColumn('visit_date'));
        Schema::table('ticket_orders', fn (Blueprint $t) => $t->dropColumn('visit_date'));
        Schema::table('ticket_types', fn (Blueprint $t) => $t->dropColumn('valid_dates'));
    }
};
