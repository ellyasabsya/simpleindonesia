<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $t) {
            if (! Schema::hasColumn('events', 'info_token')) $t->string('info_token', 40)->nullable()->unique();
            if (! Schema::hasColumn('events', 'rundown_published')) $t->boolean('rundown_published')->default(false);
        });

        if (! Schema::hasTable('event_rundown_items')) {
            Schema::create('event_rundown_items', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('event_id')->index();
                $t->date('date');
                $t->time('start_time');
                $t->time('end_time')->nullable();
                $t->string('title', 150);
                $t->string('kind', 20)->default('sesi');
                $t->string('pic', 100)->nullable();
                $t->string('location', 150)->nullable();
                $t->string('notes', 500)->nullable();
                $t->unsignedInteger('sort')->default(0);
                $t->timestamps();
            });
        }

        if (! Schema::hasTable('event_announcements')) {
            Schema::create('event_announcements', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('event_id')->index();
                $t->string('title', 150);
                $t->text('body');
                $t->string('category', 20)->default('info');
                $t->boolean('pinned')->default(false);
                $t->timestamp('published_at')->nullable();
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('event_announcements');
        Schema::dropIfExists('event_rundown_items');
        Schema::table('events', function (Blueprint $t) {
            $t->dropColumn(['info_token', 'rundown_published']);
        });
    }
};
