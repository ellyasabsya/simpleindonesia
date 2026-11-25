<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_registrations', function (Blueprint $t) {
            if (! Schema::hasColumn('event_registrations', 'checked_in_at')) $t->dateTime('checked_in_at')->nullable();
            if (! Schema::hasColumn('event_registrations', 'checked_in_by')) $t->unsignedBigInteger('checked_in_by')->nullable();
        });
        Schema::table('ticket_holders', function (Blueprint $t) {
            if (! Schema::hasColumn('ticket_holders', 'checked_in_by')) $t->unsignedBigInteger('checked_in_by')->nullable();
        });
        if (! Schema::hasTable('checkins')) {
            Schema::create('checkins', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('event_id')->index();
                $t->string('kind', 12);
                $t->string('source', 20);
                $t->unsignedBigInteger('source_id');
                $t->string('method', 12);
                $t->unsignedBigInteger('scanned_by')->nullable();
                $t->timestamps();
                $t->unique(['source', 'source_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('checkins');
    }
};
