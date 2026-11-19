<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->string('midtrans_order_id', 60)->nullable()->unique();
            $t->string('midtrans_status', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dropColumn(['midtrans_order_id', 'midtrans_status']);
        });
    }
};
