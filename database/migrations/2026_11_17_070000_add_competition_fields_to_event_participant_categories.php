<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_participant_categories', function (Blueprint $table) {
            $table->string('competition_name', 120)->nullable()->after('name');
            $table->unsignedSmallInteger('min_age')->nullable()->after('quota');
            $table->unsignedSmallInteger('max_age')->nullable()->after('min_age');
            $table->text('requirements')->nullable()->after('max_age');
            $table->json('prizes')->nullable()->after('requirements');
        });
    }

    public function down(): void
    {
        Schema::table('event_participant_categories', function (Blueprint $table) {
            $table->dropColumn(['competition_name', 'min_age', 'max_age', 'requirements', 'prizes']);
        });
    }
};
