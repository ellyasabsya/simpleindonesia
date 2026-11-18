<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('events', 'registration_fields')) {
            Schema::table('events', function (Blueprint $t) {
                $t->json('registration_fields')->nullable();
            });
        }
        if (! Schema::hasColumn('events', 'registration_message')) {
            Schema::table('events', function (Blueprint $t) {
                $t->text('registration_message')->nullable();
            });
        }

        if (! Schema::hasTable('form_registrations')) {
            Schema::create('form_registrations', function (Blueprint $t) {
                $t->id();
                $t->foreignId('event_id')->constrained()->cascadeOnDelete();
                $t->string('name');
                $t->string('email');
                $t->string('whatsapp')->nullable();
                $t->json('answers')->nullable();
                $t->timestamps();
                $t->unique(['event_id', 'email']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('form_registrations');
        foreach (['registration_fields', 'registration_message'] as $c) {
            if (Schema::hasColumn('events', $c)) {
                Schema::table('events', fn (Blueprint $t) => $t->dropColumn($c));
            }
        }
    }
};
