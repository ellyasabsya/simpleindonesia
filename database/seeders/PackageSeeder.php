<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $iklan = ['dashboard_event', 'registrasi_event', 'kalender_kegiatan'];
        $starter = array_merge($iklan, ['sub_event', 'qr_checkin', 'laporan_gabungan']);
        $professional = array_merge($starter, [
            'tiket_multi', 'pembayaran_online', 'sertifikat', 'laporan_transaksi',
            'penilaian_juri', 'voting_event', 'manajemen_tim',
        ]);

        $packages = [
            [
                'name' => 'Iklan', 'slug' => 'iklan', 'payment_type' => 'free',
                'share_percent' => null, 'price' => null,
                'event_type' => 'single', 'included_sub_events' => 0,
                'extra_sub_event_price' => null, 'assessment_addon_price' => null,
                'max_participant_categories' => 3,
                'modules' => ['iklan'], 'features' => $iklan,
                'description' => 'Tayangkan event tanpa biaya paket. Single-event, 3 kategori peserta.',
                'is_active' => true, 'sort_order' => 1,
            ],
            [
                'name' => 'Starter', 'slug' => 'starter', 'payment_type' => 'upfront',
                'share_percent' => null, 'price' => 499000,
                'event_type' => 'single', 'included_sub_events' => 0,
                'extra_sub_event_price' => 99000, 'assessment_addon_price' => 300000,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'starter'], 'features' => $starter,
                'description' => 'Single-event. Sub-event tambahan Rp99.000 per kegiatan, kategori peserta gratis.',
                'is_active' => true, 'sort_order' => 2,
            ],
            [
                'name' => 'Professional', 'slug' => 'professional', 'payment_type' => 'upfront',
                'share_percent' => null, 'price' => 999000,
                'event_type' => 'series', 'included_sub_events' => 3,
                'extra_sub_event_price' => 149000, 'assessment_addon_price' => null,
                'max_participant_categories' => null,
                'modules' => ['iklan', 'starter', 'professional'], 'features' => $professional,
                'description' => 'Series dengan 3 sub-event termasuk. Sub-event tambahan Rp149.000 per kegiatan.',
                'is_active' => true, 'sort_order' => 3,
            ],
        ];

        foreach ($packages as $p) {
            Package::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // Paket lama (Ticketing, Voting) dihapus; bila sudah dipakai event, cukup dinonaktifkan.
        foreach (Package::whereIn('slug', ['ticketing', 'voting'])->get() as $old) {
            if (Event::where('package_id', $old->id)->exists()) {
                $old->update(['is_active' => false]);
            } else {
                $old->delete();
            }
        }
    }
}
