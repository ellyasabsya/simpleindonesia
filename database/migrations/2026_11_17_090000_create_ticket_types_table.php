<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_types', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained()->cascadeOnDelete();
            $t->string('name', 60);
            $t->unsignedBigInteger('price')->default(0);
            $t->unsignedInteger('quota');
            $t->date('valid_from');
            $t->date('valid_until');
            $t->unsignedTinyInteger('max_per_order')->default(10);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_types');
    }
};
