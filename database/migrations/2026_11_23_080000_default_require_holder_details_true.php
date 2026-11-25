<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_types', fn (Blueprint $t) => $t->boolean('require_holder_details')->default(true)->change());
        DB::table('ticket_types')->update(['require_holder_details' => true]);
    }

    public function down(): void
    {
        Schema::table('ticket_types', fn (Blueprint $t) => $t->boolean('require_holder_details')->default(false)->change());
    }
};
