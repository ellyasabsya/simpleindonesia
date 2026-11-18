<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judging_settings', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->unique();
            $t->boolean('enabled')->default(false);
            $t->timestamps();
        });
        Schema::create('judging_criteria', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('name', 60);
            $t->unsignedSmallInteger('weight');
            $t->unsignedSmallInteger('max_score')->default(100);
            $t->unsignedInteger('sort')->default(0);
            $t->timestamps();
        });
        Schema::create('judges', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('name', 80);
            $t->string('contact', 80)->nullable();
            $t->boolean('active')->default(true);
            $t->string('token', 32)->unique();
            $t->timestamps();
        });
        Schema::create('judging_scores', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('judge_id');
            $t->unsignedBigInteger('registration_id');
            $t->unsignedBigInteger('criterion_id');
            $t->decimal('score', 7, 2);
            $t->timestamps();
            $t->unique(['judge_id', 'registration_id', 'criterion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_scores');
        Schema::dropIfExists('judges');
        Schema::dropIfExists('judging_criteria');
        Schema::dropIfExists('judging_settings');
    }
};
