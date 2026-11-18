<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_invitations', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->default(0);
            $t->unsignedBigInteger('user_id')->index();
            $t->string('status', 20)->default('menunggu');
            $t->unsignedBigInteger('judge_id')->nullable();
            $t->timestamps();
            $t->unique(['event_id', 'category_id', 'user_id']);
        });
        Schema::table('judges', fn (Blueprint $t) => $t->unsignedBigInteger('user_id')->nullable()->after('category_id'));
    }

    public function down(): void
    {
        Schema::table('judges', fn (Blueprint $t) => $t->dropColumn('user_id'));
        Schema::dropIfExists('judge_invitations');
    }
};
