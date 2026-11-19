<?php

namespace App\Console\Commands;

use App\Services\MidtransService;
use App\Support\MidtransFee;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MidtransBackfillMdr extends Command
{
    protected $signature = 'midtrans:backfill-mdr';
    protected $description = 'Isi payment_type dan estimasi mdr_fee untuk pesanan Midtrans yang sudah lunas';

    public function handle(MidtransService $m): int
    {
        $targets = [
            ['ticket_orders', 'status', fn ($q) => $q->where('payment_method', 'midtrans')],
            ['voting_orders', 'status', fn ($q) => $q],
            ['events', 'payment_status', fn ($q) => $q->whereNull('parent_id')],
        ];
        $done = 0;
        $fail = 0;
        foreach ($targets as [$table, $col, $scope]) {
            $q = DB::table($table)->where($col, 'lunas')->whereNotNull('midtrans_order_id')->whereNull('midtrans_payment_type');
            foreach ($scope($q)->get(['id', 'midtrans_order_id']) as $r) {
                try {
                    $p = $m->status($r->midtrans_order_id);
                    $type = $p['payment_type'] ?? null;
                    if (! $type) {
                        $fail++;
                        continue;
                    }
                    $gross = (int) round((float) ($p['gross_amount'] ?? 0));
                    DB::table($table)->where('id', $r->id)->update([
                        'midtrans_payment_type' => $type,
                        'mdr_fee' => MidtransFee::estimate($type, $gross),
                    ]);
                    $done++;
                } catch (\Throwable $e) {
                    $fail++;
                    report($e);
                }
                usleep(200000);
            }
        }
        $this->info("Terisi: {$done}, gagal/dilewati: {$fail}");

        return self::SUCCESS;
    }
}
