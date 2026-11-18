<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $cols = [
            'contact_name' => fn (Blueprint $t) => $t->string('contact_name', 120)->nullable(),
            'contact_phone' => fn (Blueprint $t) => $t->string('contact_phone', 30)->nullable(),
            'contact_email' => fn (Blueprint $t) => $t->string('contact_email', 150)->nullable(),
            'answers' => fn (Blueprint $t) => $t->json('answers')->nullable(),
            'payment_proof' => fn (Blueprint $t) => $t->string('payment_proof')->nullable(),
            'total_fee' => fn (Blueprint $t) => $t->unsignedBigInteger('total_fee')->default(0),
            'review_note' => fn (Blueprint $t) => $t->string('review_note', 500)->nullable(),
            'reviewed_at' => fn (Blueprint $t) => $t->timestamp('reviewed_at')->nullable(),
        ];
        foreach ($cols as $name => $def) {
            if (! Schema::hasColumn('event_registrations', $name)) {
                Schema::table('event_registrations', fn (Blueprint $t) => $def($t));
            }
        }

        if (! Schema::hasTable('registration_teams')) {
            Schema::create('registration_teams', function (Blueprint $t) {
                $t->id();
                $t->foreignId('event_registration_id')->constrained('event_registrations')->cascadeOnDelete();
                $t->string('name', 120);
                $t->unsignedBigInteger('participant_category_id')->nullable();
                $t->json('members')->nullable();
                $t->timestamps();
            });
        }

        if (Schema::hasTable('form_registrations') && DB::table('form_registrations')->count() === 0) {
            Schema::drop('form_registrations');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_teams');
        foreach (['contact_name', 'contact_phone', 'contact_email', 'answers', 'payment_proof', 'total_fee', 'review_note', 'reviewed_at'] as $c) {
            if (Schema::hasColumn('event_registrations', $c)) {
                Schema::table('event_registrations', fn (Blueprint $t) => $t->dropColumn($c));
            }
        }
    }
};
