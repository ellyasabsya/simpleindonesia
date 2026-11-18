<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $t) {
            $t->string('payment_status', 30)->nullable()->index();
            $t->string('payment_note')->nullable();
            $t->dateTime('payment_reviewed_at')->nullable();
        });

        foreach (DB::table('events')->whereNull('parent_id')->get(['id', 'package_snapshot']) as $e) {
            $snap = json_decode($e->package_snapshot ?? '', true) ?: [];
            if (($snap['payment_method'] ?? null) === 'transfer_manual' && ! empty($snap['payment_proof'])) {
                DB::table('events')->where('id', $e->id)->update(['payment_status' => 'menunggu_verifikasi']);
            }
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $t) {
            $t->dropColumn(['payment_status', 'payment_note', 'payment_reviewed_at']);
        });
    }
};
