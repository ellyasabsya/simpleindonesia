<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\Package;
use Illuminate\Console\Command;

class CheckAddons extends Command
{
    protected $signature = 'addons:check';

    protected $description = 'Pastikan setiap add-on berbayar benar-benar membuka fitur dan menu';

    public function handle(): int
    {
        $bad = 0;
        $features = config('features.features');

        foreach (config('addons') as $key => $def) {
            foreach ($def['features'] as $f) {
                if (empty($features[$f]['menu'])) {
                    $this->error("[$key] fitur '$f' tidak ada atau tidak punya menu.");
                    $bad++;
                }
            }
        }

        foreach (Event::whereNotNull('package_snapshot')->where('payment_status', 'lunas')->get() as $e) {
            $opt = (array) (((array) $e->package_snapshot)['options'] ?? []);
            foreach (config('addons') as $key => $def) {
                if (! empty($opt[$key]) && array_diff($def['features'], $e->effectiveFeatures())) {
                    $this->error("Event #{$e->id}: add-on $key lunas tapi fitur belum terbuka.");
                    $bad++;
                }
            }
        }

        $bad === 0 ? $this->info('OK: semua add-on terhubung ke menu.') : $this->error("$bad masalah.");

        return $bad === 0 ? self::SUCCESS : self::FAILURE;
    }
}
