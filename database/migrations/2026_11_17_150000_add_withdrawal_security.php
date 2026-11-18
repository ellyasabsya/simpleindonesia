<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('withdrawal_pin')->nullable();
            $table->unsignedTinyInteger('pin_attempts')->default(0);
            $table->timestamp('pin_locked_until')->nullable();
        });
        Schema::table('institutions', function (Blueprint $table) {
            $table->string('payout_bank', 60)->nullable();
            $table->string('payout_account_number', 40)->nullable();
            $table->string('payout_account_name', 100)->nullable();
            $table->timestamp('payout_hold_until')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['withdrawal_pin', 'pin_attempts', 'pin_locked_until']);
        });
        Schema::table('institutions', function (Blueprint $table) {
            $table->dropColumn(['payout_bank', 'payout_account_number', 'payout_account_name', 'payout_hold_until']);
        });
    }
};
