<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('judging_publications', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->default(0);
            $t->unsignedInteger('number');
            $t->longText('rules');
            $t->string('rules_hash', 64);
            $t->string('note', 300)->nullable();
            $t->string('published_by', 120)->nullable();
            $t->unsignedInteger('recipients')->default(0);
            $t->timestamps();
            $t->unique(['event_id', 'category_id', 'number']);
        });

        Schema::create('judging_publication_settings', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id');
            $t->unsignedBigInteger('category_id')->default(0);
            $t->string('visibility', 10)->default('hidden');
            $t->boolean('appeals_open')->default(false);
            $t->dateTime('appeals_deadline')->nullable();
            $t->timestamps();
            $t->unique(['event_id', 'category_id']);
        });

        Schema::create('judging_appeals', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->default(0);
            $t->string('participant_name', 150);
            $t->text('reason');
            $t->string('status', 10)->default('baru');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_appeals');
        Schema::dropIfExists('judging_publication_settings');
        Schema::dropIfExists('judging_publications');
    }
};
