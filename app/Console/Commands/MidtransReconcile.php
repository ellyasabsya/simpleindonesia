<?php

namespace App\Console\Commands;

use App\Http\Controllers\MidtransController;
use App\Services\MidtransService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MidtransReconcile extends Command
{
    protected $signature = 'midtrans:reconcile';

    protected $description = 'Sinkronkan pembayaran Midtrans yang belum terkonfirmasi (cadangan webhook)';

    public function handle(MidtransController $c, MidtransService $m): int
    {
        $since = now()->subDays(2);
        $n = 0;

        foreach (DB::table('voting_orders')->where('status', 'menunggu')->whereNotNull('midtrans_order_id')->where('created_at', '>', $since)->pluck('code') as $code) {
            $c->voteSync($code, $m);
            $n++;
        }
        foreach (DB::table('ticket_orders')->where('status', 'menunggu')->where('payment_method', 'midtrans')->whereNotNull('midtrans_order_id')->where('created_at', '>', $since)->pluck('code') as $code) {
            $c->ticketSync($code, $m);
            $n++;
        }
        foreach (DB::table('events')->whereNull('parent_id')->where('payment_status', 'menunggu_pembayaran')->whereNotNull('midtrans_order_id')->pluck('id') as $id) {
            $c->eventSync((int) $id, $m);
            $n++;
        }

        $this->info("Dicek: {$n} pesanan");

        return self::SUCCESS;
    }
}
