<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('judging_publication_settings', function (Blueprint $t) {
            $t->boolean('rules_sent')->default(false)->after('visibility');
        });
    }

    public function down(): void
    {
        Schema::table('judging_publication_settings', function (Blueprint $t) {
            $t->dropColumn('rules_sent');
        });
    }
};
