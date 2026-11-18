<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->decimal('fee_percent', 5, 2)->default(10)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dropColumn('fee_percent');
        });
    }
};
