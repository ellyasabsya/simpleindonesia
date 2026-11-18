<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $t->foreignId('event_id')->constrained()->cascadeOnDelete();
            $t->unsignedBigInteger('amount');
            $t->string('bank_name', 60);
            $t->string('account_number', 40);
            $t->string('account_name', 100);
            $t->string('status', 20)->default('menunggu')->index();
            $t->string('reject_reason', 300)->nullable();
            $t->string('transfer_proof')->nullable();
            $t->dateTime('approved_at')->nullable();
            $t->dateTime('transferred_at')->nullable();
            $t->timestamps();
            $t->index(['event_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
