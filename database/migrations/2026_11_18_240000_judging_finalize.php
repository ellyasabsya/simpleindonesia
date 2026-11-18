<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('judging_settings', function (Blueprint $t) {
            $t->dateTime('finalized_at')->nullable();
            $t->string('finalized_by', 120)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('judging_settings', function (Blueprint $t) {
            $t->dropColumn(['finalized_at', 'finalized_by']);
        });
    }
};
