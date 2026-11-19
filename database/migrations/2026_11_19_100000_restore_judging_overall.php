<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('judging_overall')) {
            return;
        }
        Schema::create('judging_overall', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->unique();
            $t->text('points_json');
            $t->unsignedTinyInteger('winner_count')->default(3);
            $t->longText('snapshot_json')->nullable();
            $t->timestamp('finalized_at')->nullable();
            $t->string('finalized_by', 120)->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_overall');
    }
};
