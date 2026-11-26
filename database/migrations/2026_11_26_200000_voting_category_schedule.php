<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voting_categories', function (Blueprint $t) {
            if (! Schema::hasColumn('voting_categories', 'opens_at')) $t->dateTime('opens_at')->nullable();
            if (! Schema::hasColumn('voting_categories', 'closes_at')) $t->dateTime('closes_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('voting_categories', function (Blueprint $t) {
            $t->dropColumn(['opens_at', 'closes_at']);
        });
    }
};
