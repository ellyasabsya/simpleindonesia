<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('judging_systems', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id');
            $t->unsignedBigInteger('category_id')->default(0);
            $t->string('system', 30)->nullable();
            $t->timestamps();
            $t->unique(['event_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_systems');
    }
};
