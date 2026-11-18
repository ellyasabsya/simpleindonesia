<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->unsignedBigInteger('user_id')->nullable()->index()->after('event_id');
        });

        Schema::create('ticket_holders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('ticket_order_id')->constrained('ticket_orders')->cascadeOnDelete();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->foreignId('ticket_type_id')->constrained('ticket_types')->cascadeOnDelete();
            $t->string('code', 40)->unique();
            $t->string('holder_name', 100);
            $t->dateTime('checked_in_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_holders');
        Schema::table('ticket_orders', function (Blueprint $t) {
            $t->dropColumn('user_id');
        });
    }
};
