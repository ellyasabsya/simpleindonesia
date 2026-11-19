<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ticket_types', 'audience')) {
            Schema::table('ticket_types', fn (Blueprint $t) => $t->string('audience', 10)->default('peserta'));
        }
    }

    public function down(): void
    {
        Schema::table('ticket_types', fn (Blueprint $t) => $t->dropColumn('audience'));
    }
};
