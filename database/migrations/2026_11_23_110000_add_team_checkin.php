<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registration_teams', function (Blueprint $t) {
            if (! Schema::hasColumn('registration_teams', 'team_code')) $t->string('team_code', 60)->nullable()->index();
            if (! Schema::hasColumn('registration_teams', 'checked_in_at')) $t->dateTime('checked_in_at')->nullable();
            if (! Schema::hasColumn('registration_teams', 'checked_in_by')) $t->unsignedBigInteger('checked_in_by')->nullable();
        });
    }

    public function down(): void
    {
    }
};
