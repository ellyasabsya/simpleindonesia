<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Iklan', 'slug' => 'iklan', 'payment_type' => 'free',
                'modules' => ['iklan'], 'features' => ['ad_publication'],
                'description' => 'Tanpa biaya paket, diperiksa admin sebelum tayang.', 'sort_order' => 1,
            ],
            [
                'name' => 'Ticketing', 'slug' => 'ticketing', 'payment_type' => 'revenue_share', 'share_percent' => 10,
                'modules' => ['ticketing'],
                'features' => ['dashboard_event', 'agenda_event', 'ticket_sales', 'ticket_checkin', 'ticket_report'],
                'description' => 'Bagi hasil, tanpa biaya paket di muka.', 'sort_order' => 2,
            ],
            [
                'name' => 'Voting', 'slug' => 'voting', 'payment_type' => 'revenue_share', 'share_percent' => 10,
                'modules' => ['voting'],
                'features' => ['dashboard_event', 'agenda_event', 'voting_setup', 'voting_report'],
                'description' => 'Bagi hasil, tanpa biaya paket di muka.', 'sort_order' => 3,
            ],
        ];

        foreach ($packages as $p) {
            Package::updateOrCreate(['slug' => $p['slug']], $p);
        }
    }
}
