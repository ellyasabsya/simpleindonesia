<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('daily_checkins')) {
            return;
        }
        Schema::create('daily_checkins', function (Blueprint $t) {
            $t->id();
            $t->string('holder_type', 20); // ticket | registration | team
            $t->unsignedBigInteger('holder_id');
            $t->date('visit_date');
            $t->timestamp('checked_in_at')->nullable();
            $t->timestamps();
            $t->unique(['holder_type', 'holder_id', 'visit_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_checkins');
    }
};
