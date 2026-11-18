<?php

namespace App\Console\Commands;

use App\Models\Package;
use Illuminate\Console\Command;

class SyncEventFeatures extends Command
{
    protected $signature = 'events:sync-features {--dry-run : Hanya tampilkan, tanpa menyimpan}';

    protected $description = 'Tambahkan fitur baru paket ke snapshot event yang sudah ada (tidak mencabut fitur).';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        foreach (Package::all() as $package) {
            $n = $package->syncEventSnapshots($dry);
            if ($n > 0) {
                $this->info("{$package->name}: {$n} event ".($dry ? 'akan diperbarui' : 'diperbarui'));
            }
        }

        return self::SUCCESS;
    }
}
