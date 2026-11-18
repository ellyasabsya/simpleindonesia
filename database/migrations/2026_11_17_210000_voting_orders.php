<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voting_settings', function (Blueprint $t) {
            $t->date('vote_start')->nullable();
            $t->date('vote_end')->nullable();
        });
        Schema::create('voting_orders', function (Blueprint $t) {
            $t->id();
            $t->string('code', 16)->unique();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('participant_id')->index();
            $t->unsignedBigInteger('gift_id')->nullable();
            $t->string('buyer_name', 80);
            $t->string('buyer_email', 120);
            $t->unsignedInteger('votes');
            $t->unsignedInteger('amount');
            $t->string('message', 200)->nullable();
            $t->string('status', 30)->default('menunggu_verifikasi')->index();
            $t->string('payment_proof')->nullable();
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voting_orders');
        Schema::table('voting_settings', function (Blueprint $t) {
            $t->dropColumn(['vote_start', 'vote_end']);
        });
    }
};
