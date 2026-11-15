<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('address')->nullable();
            $table->string('website')->nullable();
            $table->string('logo_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->dropColumn(['description', 'address', 'website', 'logo_path']);
        });
    }
};
