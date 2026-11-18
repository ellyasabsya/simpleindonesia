<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_types', function (Blueprint $table) {
            if (! Schema::hasColumn('ticket_types', 'support_enabled')) {
                $table->boolean('support_enabled')->default(false);
            }
            $table->text('support_options')->nullable();
        });
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->string('support_choice', 80)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->dropColumn('support_choice');
        });
        Schema::table('ticket_types', function (Blueprint $table) {
            $table->dropColumn('support_options');
        });
    }
};
