<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_support_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id')->index();
            $table->string('name', 80);
            $table->timestamps();
        });
        Schema::table('ticket_types', function (Blueprint $table) {
            $table->boolean('support_enabled')->default(false);
        });
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('support_option_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->dropColumn('support_option_id');
        });
        Schema::table('ticket_types', function (Blueprint $table) {
            $table->dropColumn('support_enabled');
        });
        Schema::dropIfExists('ticket_support_options');
    }
};
