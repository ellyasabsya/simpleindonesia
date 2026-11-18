<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_members', function (Blueprint $table) {
            // Anggota yang sudah ada otomatis aktif.
            $table->string('status', 20)->default('aktif')->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('institution_members', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
