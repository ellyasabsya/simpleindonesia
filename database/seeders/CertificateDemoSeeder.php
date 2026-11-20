<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\CertificateRecipient;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Data uji Tahap 3. Jalankan: php artisan db:seed --class=CertificateDemoSeeder
 * Opsional: EVENT_ID=17 php artisan db:seed --class=CertificateDemoSeeder
 * Aman diulang: penerima dengan nama sama tidak digandakan.
 */
class CertificateDemoSeeder extends Seeder
{
    public function run(): void
    {
        $eventId = (int) (getenv('EVENT_ID') ?: 17);
        $event = DB::table('events')->where('id', $eventId)->first();
        if (! $event) {
            $this->command?->error("Event {$eventId} tidak ditemukan.");

            return;
        }
        $org = (string) DB::table('institutions')->where('id', $event->institution_id)->value('name');

        $people = [
            ['pemateri', 'Dr. Ratna Sari'],
            ['pemateri', 'Budi Hartono, M.Kom.'],
            ['moderator', 'Citra Lestari'],
            ['panitia', 'Dimas Prasetyo'],
            ['panitia', 'Eka Wulandari'],
            ['khusus', 'Fajar Nugroho'],
        ];

        foreach ($people as $i => [$cat, $name]) {
            $r = CertificateRecipient::firstOrCreate(
                ['event_id' => $eventId, 'category' => $cat, 'name' => $name],
                ['award_title' => $cat === 'khusus' ? 'Peserta Teraktif' : null]
            );

            $key = 'manual:'.$r->id;
            if (Certificate::where('event_id', $eventId)->where('recipient_key', $key)->exists() || $i > 3) {
                continue; // dua terakhir dibiarkan "belum terbit"
            }

            $c = Certificate::create([
                'event_id' => $eventId,
                'institution_id' => $event->institution_id,
                'category' => $cat,
                'recipient_key' => $key,
                'recipient_name' => $name,
                'event_title' => $event->title,
                'organizer_name' => $org,
                'certificate_number' => sprintf('DEMO/%d/%s/%03d', $eventId, strtoupper($cat), $r->id),
                'verify_token' => Certificate::newToken(),
                'status' => Certificate::ISSUED,
                'issued_at' => now(),
            ]);
            $c->record('issued', null, ['seed' => true]);

            if ($i === 3) { // satu sertifikat dicabut untuk uji tampilan
                $c->update(['status' => Certificate::REVOKED, 'revoked_at' => now(), 'revoked_reason' => 'Data uji']);
                $c->record('revoked', null, ['seed' => true]);
            }
        }

        $this->command?->info('Data uji sertifikat dibuat untuk event '.$eventId.'.');
    }
}
