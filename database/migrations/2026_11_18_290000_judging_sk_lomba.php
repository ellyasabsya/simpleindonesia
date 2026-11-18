<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('judging_sk')) {
            return;
        }
        Schema::create('judging_sk', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('event_id')->unique();
            $t->string('number', 100);
            $t->date('sk_date');
            $t->string('signer_name', 150);
            $t->string('signer_position', 150);
            $t->longText('snapshot_json')->nullable();
            $t->timestamp('finalized_at')->nullable();
            $t->string('finalized_by', 120)->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        // tabel dibagikan dengan skrip SK sebelumnya, jadi tidak dihapus di sini
    }
};
