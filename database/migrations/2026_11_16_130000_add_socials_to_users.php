<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'socials')) {
            Schema::table('users', fn ($t) => $t->text('socials')->nullable());
        }
        DB::table('users')->whereNotNull('instagram')->get()->each(function ($u) {
            DB::table('users')->where('id', $u->id)->update(['socials' => json_encode(['instagram' => ltrim($u->instagram, '@')])]);
        });
    }

    public function down(): void {}
};
