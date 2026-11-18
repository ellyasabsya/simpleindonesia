<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('judging_tie_decisions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->index();
            $t->unsignedBigInteger('category_id')->default(0);
            $t->string('group_key', 150);
            $t->text('ids_json');
            $t->string('decision', 10);
            $t->text('order_json')->nullable();
            $t->text('note');
            $t->string('decided_by', 120)->nullable();
            $t->timestamps();
            $t->index(['event_id', 'category_id', 'group_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_tie_decisions');
    }
};
