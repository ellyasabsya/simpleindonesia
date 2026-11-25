<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        // ISI HARGA DI SINI (rupiah, bayar di muka). 0 = gratis.
        $harga = [
            'iklan' => 0,
            'starter' => 0,
            'professional' => 0,
        ];

        $iklan = ['dashboard_event', 'registrasi_peserta', 'kalender_kegiatan'];
        $starter = [...$iklan, 'qr_checkin', 'laporan_gabungan'];
        $pro = [...$starter, 'sub_event', 'tiket_multi', 'pembayaran_online', 'sertifikat',
            'penilaian_juri', 'voting_event', 'manajemen_tim'];
        $ticketing = [...$iklan, 'tiket_multi', 'pembayaran_online'];

        $rows = [
            [
                'slug' => 'iklan', 'name' => 'Iklan', 'sort_order' => 1,
                'description' => 'Tayangkan event Anda',
                'event_type' => 'single', 'price' => $harga['iklan'],
                'share_percent' => null, 'included_sub_events' => 0,
                'extra_sub_event_price' => null, 'assessment_addon_price' => null,
                'max_participant_categories' => 3,
                'modules' => ['iklan'], 'features' => $iklan,
            ],
            [
                'slug' => 'starter', 'name' => 'Starter', 'sort_order' => 2,
                'description' => 'Program kecil',
                'event_type' => 'single', 'price' => $harga['starter'],
                'share_percent' => null, 'included_sub_events' => 0,
                'extra_sub_event_price' => 99000, 'assessment_addon_price' => 250000, 'judge_addon_price' => 100000,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'starter'], 'features' => $starter,
            ],
            [
                'slug' => 'professional', 'name' => 'Professional', 'sort_order' => 3,
                'description' => 'Untuk series kegiatan',
                'event_type' => 'series', 'price' => $harga['professional'],
                'share_percent' => null, 'included_sub_events' => 3,
                'extra_sub_event_price' => 149000, 'assessment_addon_price' => null,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'starter', 'ticketing', 'voting', 'professional'], 'features' => $pro,
            ],
            [
                'slug' => 'ticketing', 'name' => 'Ticketing', 'sort_order' => 4,
                'description' => 'Jual tiket, bayar bagi hasil',
                'event_type' => 'single', 'price' => null,
                'share_percent' => 10, 'included_sub_events' => 0,
                'extra_sub_event_price' => null, 'assessment_addon_price' => null,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'ticketing'], 'features' => $ticketing,
            ],
            [
                'slug' => 'ticketing-voting', 'name' => 'Ticketing & Voting', 'sort_order' => 5,
                'description' => 'Tiket dan voting, bayar bagi hasil',
                'event_type' => 'single', 'price' => null,
                'share_percent' => 10, 'included_sub_events' => 0,
                'extra_sub_event_price' => null, 'assessment_addon_price' => null,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'ticketing', 'voting'], 'features' => [...$ticketing, 'voting_event'],
            ],
        ];

        foreach ($rows as $r) {
            $r['payment_type'] = $r['share_percent'] !== null
                ? 'revenue_share'
                : (($r['price'] ?? 0) > 0 ? 'upfront' : 'free');

            Package::updateOrCreate(['slug' => $r['slug']], $r + ['is_active' => true]);
        }

        Package::whereNotIn('slug', array_column($rows, 'slug'))->update(['is_active' => false]);

        // buang kunci fitur yang sudah tidak ada di config dari semua paket
        $valid = array_keys(config('features.features'));
        Package::all()->each(function (Package $p) use ($valid) {
            $p->update(['features' => array_values(array_intersect($p->features ?? [], $valid))]);
        });
    }
}
