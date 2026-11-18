<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->string('payment_method', 30)->nullable()->after('status');
            $t->string('payment_proof')->nullable()->after('payment_method');
            $t->dateTime('paid_at')->nullable()->after('payment_proof');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dropColumn(['payment_method', 'payment_proof', 'paid_at']);
        });
    }
};
