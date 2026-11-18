<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('judging_settings', function (Blueprint $t) {
            $t->unsignedSmallInteger('scale')->default(100);
            $t->unsignedSmallInteger('judge_count')->default(3);
            $t->unsignedTinyInteger('avg_decimals')->default(2);
            $t->string('rounding', 10)->default('nearest');
            $t->boolean('deduction_enabled')->default(false);
        });
        Schema::table('judging_criteria', function (Blueprint $t) {
            $t->string('description', 200)->nullable();
        });
        Schema::create('judging_deductions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->string('name', 60);
            $t->decimal('points', 7, 2)->default(0);
            $t->unsignedInteger('sort')->default(0);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_deductions');
        Schema::table('judging_criteria', fn (Blueprint $t) => $t->dropColumn('description'));
        Schema::table('judging_settings', fn (Blueprint $t) => $t->dropColumn(['scale', 'judge_count', 'avg_decimals', 'rounding', 'deduction_enabled']));
    }
};
