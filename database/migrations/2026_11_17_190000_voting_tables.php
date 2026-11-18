<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voting_settings', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->unique();
            $t->boolean('enabled')->default(false);
            $t->unsignedInteger('price_per_vote')->default(1000);
            $t->unsignedInteger('min_votes')->default(1);
            $t->boolean('message_enabled')->default(true);
            $t->unsignedSmallInteger('message_max')->default(100);
            $t->unsignedInteger('sound_min_votes')->default(0);
            $t->boolean('show_sender')->default(true);
            $t->boolean('show_ranking')->default(true);
            $t->boolean('show_votes')->default(true);
            $t->timestamps();
        });
        Schema::create('voting_categories', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('name', 60);
            $t->unsignedInteger('sort')->default(0);
            $t->timestamps();
        });
        Schema::create('voting_participants', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->nullable()->index();
            $t->string('name', 80);
            $t->string('description', 160)->nullable();
            $t->boolean('active')->default(true);
            $t->unsignedInteger('sort')->default(0);
            $t->timestamps();
        });
        Schema::create('voting_gifts', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('emoji', 16);
            $t->string('name', 40);
            $t->unsignedInteger('votes');
            $t->unsignedInteger('price')->default(0);
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voting_gifts');
        Schema::dropIfExists('voting_participants');
        Schema::dropIfExists('voting_categories');
        Schema::dropIfExists('voting_settings');
    }
};
