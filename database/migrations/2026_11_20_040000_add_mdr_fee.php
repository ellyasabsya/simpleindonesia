<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['ticket_orders', 'voting_orders', 'events'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->unsignedInteger('mdr_fee')->default(0);
                $table->string('midtrans_payment_type', 40)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['ticket_orders', 'voting_orders', 'events'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropColumn(['mdr_fee', 'midtrans_payment_type']);
            });
        }
    }
};
