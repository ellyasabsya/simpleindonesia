<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained()->cascadeOnDelete();
            $t->foreignId('ticket_type_id')->constrained()->cascadeOnDelete();
            $t->string('code')->unique();
            $t->string('buyer_name', 100);
            $t->string('buyer_email', 120);
            $t->string('buyer_phone', 30);
            $t->unsignedTinyInteger('quantity');
            $t->unsignedBigInteger('subtotal');
            $t->unsignedBigInteger('fee');
            $t->unsignedBigInteger('total');
            $t->json('holders');
            $t->string('status', 20)->default('menunggu');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_orders');
    }
};
