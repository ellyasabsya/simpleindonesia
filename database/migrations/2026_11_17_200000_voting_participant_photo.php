<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voting_participants', function (Blueprint $t) {
            $t->string('photo', 200)->nullable();
            $t->string('upload_token', 40)->nullable();
        });
        foreach (DB::table('voting_participants')->pluck('id') as $id) {
            DB::table('voting_participants')->where('id', $id)->update(['upload_token' => Str::random(32)]);
        }
        Schema::table('voting_participants', function (Blueprint $t) {
            $t->unique('upload_token');
        });
    }

    public function down(): void
    {
        Schema::table('voting_participants', function (Blueprint $t) {
            $t->dropUnique(['upload_token']);
            $t->dropColumn(['photo', 'upload_token']);
        });
    }
};
