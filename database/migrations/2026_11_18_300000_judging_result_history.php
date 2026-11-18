<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('judging_settings', function (Blueprint $t) {
            if (! Schema::hasColumn('judging_settings', 'saved_at')) {
                $t->timestamp('saved_at')->nullable();
            }
            if (! Schema::hasColumn('judging_settings', 'saved_by')) {
                $t->string('saved_by', 120)->nullable();
            }
            if (! Schema::hasColumn('judging_settings', 'saved_version')) {
                $t->unsignedInteger('saved_version')->default(0);
            }
        });

        if (! Schema::hasTable('judging_result_history')) {
            Schema::create('judging_result_history', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('event_id');
                $t->unsignedBigInteger('category_id')->default(0);
                $t->unsignedInteger('version');
                $t->string('action', 20);
                $t->text('reason')->nullable();
                $t->string('actor', 120)->nullable();
                $t->longText('snapshot_json')->nullable();
                $t->timestamps();
                $t->index(['event_id', 'category_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_result_history');
    }
};
