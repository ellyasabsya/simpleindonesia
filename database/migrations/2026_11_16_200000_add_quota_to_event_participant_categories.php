<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_participant_categories', function (Blueprint $table) {
            $table->unsignedInteger('quota')->default(0)->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('event_participant_categories', function (Blueprint $table) {
            $table->dropColumn('quota');
        });
    }
};
