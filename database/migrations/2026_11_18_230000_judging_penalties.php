<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('judging_penalties', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->default(0);
            $t->unsignedBigInteger('registration_id')->index();
            $t->string('type', 40);
            $t->decimal('points', 8, 2)->default(0);
            $t->text('reason');
            $t->string('status', 12)->default('diajukan');
            $t->string('created_by', 120)->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_penalties');
    }
};
