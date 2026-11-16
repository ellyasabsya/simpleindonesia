<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('event_id')->constrained()->cascadeOnDelete();
            $t->string('status')->default('terdaftar');
            $t->timestamps();
            $t->unique(['user_id', 'event_id']);
        });

        Schema::create('tickets', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('event_id')->constrained()->cascadeOnDelete();
            $t->string('code')->unique();
            $t->unsignedInteger('quantity')->default(1);
            $t->unsignedBigInteger('total_price')->default(0);
            $t->string('status')->default('aktif');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('event_registrations');
    }
};
