<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RefundEventPackage extends Command
{
    protected $signature = 'event:refund {id : ID event utama} {--reason= : Alasan refund}';
    protected $description = 'Tandai paket event lunas sebagai dikembalikan (keluar dari pendapatan platform)';

    public function handle(): int
    {
        $e = DB::table('events')->whereNull('parent_id')->where('id', $this->argument('id'))->first();
        if (! $e) {
            $this->error('Event utama tidak ditemukan.');
            return self::FAILURE;
        }
        $note = trim(($e->payment_note ? $e->payment_note."\n" : '').'[Refund '.now()->format('Y-m-d H:i').'] '.($this->option('reason') ?: '-'));
        $n = DB::table('events')->where('id', $e->id)->where('payment_status', 'lunas')
            ->update(['payment_status' => 'dikembalikan', 'payment_note' => $note, 'updated_at' => now()]);
        if (! $n) {
            $this->error("Status saat ini '{$e->payment_status}', hanya 'lunas' yang bisa di-refund.");
            return self::FAILURE;
        }
        $this->info("Event #{$e->id} ({$e->title}) ditandai dikembalikan. Transfer uangnya ke lembaga tetap manual.");
        return self::SUCCESS;
    }
}
