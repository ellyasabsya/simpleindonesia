<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_types', function (Blueprint $table) {
            $table->unsignedSmallInteger('valid_days')->default(1);
            $table->boolean('custom_sale')->default(false);
            $table->boolean('require_holder_details')->default(false);
        });
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->text('holder_details')->nullable();
        });

        // Jenis tiket lama: masa berlaku = lama event, jadwal jual dianggap khusus (tanggalnya sudah eksplisit).
        foreach (DB::table('ticket_types as t')->join('events as e', 'e.id', '=', 't.event_id')->get(['t.id', 'e.starts_at', 'e.ends_at']) as $r) {
            $days = (int) abs(Carbon::parse($r->starts_at)->startOfDay()->diffInDays(Carbon::parse($r->ends_at)->startOfDay())) + 1;
            DB::table('ticket_types')->where('id', $r->id)->update(['valid_days' => max(1, $days), 'custom_sale' => 1]);
        }
    }

    public function down(): void
    {
        Schema::table('ticket_types', function (Blueprint $table) {
            $table->dropColumn(['valid_days', 'custom_sale', 'require_holder_details']);
        });
        Schema::table('ticket_orders', function (Blueprint $table) {
            $table->dropColumn('holder_details');
        });
    }
};
