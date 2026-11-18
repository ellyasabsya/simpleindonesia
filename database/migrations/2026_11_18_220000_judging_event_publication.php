<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('judging_event_publication', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->unique();
            $t->string('visibility', 10)->default('hidden');
            $t->boolean('appeals_open')->default(false);
            $t->dateTime('appeals_deadline')->nullable();
            $t->timestamps();
        });

        $seen = [];
        foreach (DB::table('judging_publication_settings')->orderBy('id')->get() as $r) {
            if (isset($seen[$r->event_id])) {
                continue;
            }
            $seen[$r->event_id] = true;
            DB::table('judging_event_publication')->insert([
                'event_id' => $r->event_id, 'visibility' => $r->visibility,
                'appeals_open' => $r->appeals_open, 'appeals_deadline' => $r->appeals_deadline,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('judging_event_publication');
    }
};
