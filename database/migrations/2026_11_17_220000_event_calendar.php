<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $t) {
            $t->date('registration_start')->nullable();
            $t->date('registration_end')->nullable();
            $t->date('preparation_start')->nullable();
            $t->date('preparation_end')->nullable();
        });
        Schema::create('event_agendas', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('title', 120);
            $t->date('date')->index();
            $t->time('start_time')->nullable();
            $t->time('end_time')->nullable();
            $t->string('location', 150)->nullable();
            $t->string('description', 500)->nullable();
            $t->string('type', 20)->default('agenda');
            $t->unsignedInteger('remind_minutes')->nullable();
            $t->timestamp('reminded_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_agendas');
        Schema::table('events', function (Blueprint $t) {
            $t->dropColumn(['registration_start', 'registration_end', 'preparation_start', 'preparation_end']);
        });
    }
};
