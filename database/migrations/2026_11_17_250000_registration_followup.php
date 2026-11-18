<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('event_registrations', 'followup_answers')) {
            Schema::table('event_registrations', fn (Blueprint $t) => $t->json('followup_answers')->nullable());
        }
        if (! Schema::hasColumn('event_registrations', 'completed_at')) {
            Schema::table('event_registrations', fn (Blueprint $t) => $t->timestamp('completed_at')->nullable());
        }
    }

    public function down(): void
    {
        foreach (['followup_answers', 'completed_at'] as $c) {
            if (Schema::hasColumn('event_registrations', $c)) {
                Schema::table('event_registrations', fn (Blueprint $t) => $t->dropColumn($c));
            }
        }
    }
};
