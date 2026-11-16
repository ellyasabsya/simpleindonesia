<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // single = single-event, series = punya sub-event
            $table->string('event_type')->default('single')->after('payment_type');
            // jumlah sub-event yang sudah termasuk di harga paket
            $table->unsignedInteger('included_sub_events')->default(0)->after('event_type');
            // harga per sub-event tambahan; null = tidak tersedia
            $table->unsignedBigInteger('extra_sub_event_price')->nullable()->after('included_sub_events');
            // harga add-on sistem penilaian; null = tidak ada add-on
            $table->unsignedBigInteger('assessment_addon_price')->nullable()->after('extra_sub_event_price');
            // batas kategori peserta; null = tanpa batas
            $table->unsignedInteger('max_participant_categories')->nullable()->after('assessment_addon_price');
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn([
                'event_type',
                'included_sub_events',
                'extra_sub_event_price',
                'assessment_addon_price',
                'max_participant_categories',
            ]);
        });
    }
};
