<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            if (! Schema::hasColumn('ticket_orders', 'reject_reason')) {
                $t->text('reject_reason')->nullable();
            }
            if (! Schema::hasColumn('ticket_orders', 'rejected_at')) {
                $t->timestamp('rejected_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_orders', function (Blueprint $t) {
            foreach (['reject_reason', 'rejected_at'] as $c) {
                if (Schema::hasColumn('ticket_orders', $c)) {
                    $t->dropColumn($c);
                }
            }
        });
    }
};
