<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use App\Support\Judging;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Data uji Penilaian. Semua data berlabel [TES] / tes-*@example.test.
 * Jalankan : php artisan db:seed --class=JudgingTestSeeder
 * Bersihkan: php artisan tinker --execute="Database\Seeders\JudgingTestSeeder::cleanup();"
 * Institusi: otomatis institusi pertama, atau set TES_INSTITUTION_ID di .env.
 */
class JudgingTestSeeder extends Seeder
{
    // Tiap tim: k (1-5) untuk [krit1: juri1, juri2, juri3], [krit2: juri1, juri2, juri3]
    private const M = [
        1 => [[5, 5, 4], [5, 4, 5]], // 280
        2 => [[5, 4, 4], [4, 4, 5]], // 260
        3 => [[5, 4, 4], [4, 4, 5]], // 260 (SERI dengan tim 2)
        4 => [[4, 4, 4], [4, 4, 3]], // 232
        5 => [[4, 3, 4], [3, 4, 3]], // 212
        6 => [[3, 3, 4], [3, 3, 3]], // 192
        7 => [[3, 3, 2], [3, 2, 3]], // 160
        8 => [[2, 2, 3], [2, 2, 2]], // 132
    ];
    private const SCHOOLS = ['SMA Negeri 1 Tes', 'SMA Negeri 2 Tes', 'SMK Harapan Tes', 'MAN Tes'];

    private array $users = [];
    private int $pool = 0;

    public static function cleanup(): void
    {
        $ids = DB::table('events')->where('title', 'like', '[TES]%')->pluck('id')->all();
        if ($ids) {
            $judges = DB::table('judges')->whereIn('event_id', $ids)->pluck('id')->all();
            DB::table('judging_scores')->whereIn('judge_id', $judges)->delete();
            foreach (['judging_settings', 'judging_criteria', 'judges', 'judging_deductions', 'judging_systems', 'judging_penalties',
                'judging_tie_decisions', 'judging_result_history', 'judging_sk', 'judging_publications',
                'judging_publication_settings', 'judging_event_publication', 'judging_appeals', 'judge_invitations', 'event_participant_categories', 'event_registrations'] as $tb) {
                DB::table($tb)->whereIn('event_id', $ids)->delete();
            }
            DB::table('events')->whereIn('id', $ids)->delete();
        }
        DB::table('users')->where('email', 'like', 'tes-peserta-%@example.test')->delete();
    }

    public function run(): void
    {
        self::cleanup();

        $inst = env('TES_INSTITUTION_ID') ?: DB::table('institutions')->orderBy('id')->value('id');
        if (! $inst) {
            $inst = \App\Models\Institution::factory()->create()->id;
        }
        for ($i = 1; $i <= 20; $i++) {
            $this->users[] = User::factory()->create(['name' => "Peserta Tes $i", 'email' => "tes-peserta-$i@example.test"])->id;
        }

        $parent = $this->event($inst, '[TES] Festival Utama', null, 0);

        // Sub A: 2 kategori
        $a = $this->event($inst, '[TES] Lomba A (2 kategori)', $parent->id, 1);
        $putra = $this->cat($a->id, 'Putra');
        $putri = $this->cat($a->id, 'Putri');
        $this->system($a->id);
        $r = $this->category($a->id, $putra, 'A-PA', [1, 2, 3, 4, 5, 6, 7, 8], null, 0);
        DB::table('judging_penalties')->insert([
            'event_id' => $a->id, 'category_id' => $putra, 'registration_id' => $r[4], 'type' => 'pelanggaran', 'points' => 5,
            'reason' => '[TES] Melewati batas waktu, menunggu keputusan', 'status' => 'diajukan', 'created_by' => 'TES',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        // Putri: tim terakhir belum dinilai juri 3 -> harus menghalangi Simpan hasil
        $this->category($a->id, $putri, 'A-PI', [1, 2, 4, 5, 6, 8], 6, 8);

        // Sub B: tanpa kategori, lengkap, tanpa seri
        $b = $this->event($inst, '[TES] Lomba B (tanpa kategori)', $parent->id, 2);
        $this->system($b->id);
        $this->category($b->id, 0, 'B', [1, 2, 4, 6, 8], null, 0);

        // Sub C: belum memilih sistem penilaian
        $c = $this->event($inst, '[TES] Lomba C (belum pilih sistem)', $parent->id, 3);
        $this->cat($c->id, 'Umum');
        $this->regs($c->id, DB::table('event_participant_categories')->where('event_id', $c->id)->value('id'), 'C', [1, 4, 8]);

        $this->command?->info('Seeder selesai. Token juri:');
        foreach (DB::table('judges')->whereIn('event_id', [$a->id, $b->id])->get(['event_id', 'category_id', 'name', 'token']) as $j) {
            $this->command?->line("  event {$j->event_id} kat {$j->category_id} | {$j->name} | {$j->token}");
        }
        $this->command?->info("Event utama: /panel/event/{$parent->id}/penilaian  (cari URL juri: php artisan route:list | grep -i juri)");
    }

    private function event($inst, string $title, ?int $parentId, int $order): Event
    {
        $this->pool = 0; // user boleh dipakai ulang antar-event, tapi tidak dalam satu event
        return Event::create([
            'institution_id' => $inst, 'title' => $title, 'slug' => Str::slug($title).'-'.Str::lower(Str::random(5)),
            'location' => 'Tes', 'starts_at' => now()->toDateString(), 'ends_at' => now()->addDay()->toDateString(),
            'status' => 'published', 'parent_id' => $parentId, 'sub_order' => $order,
            'payment_status' => 'lunas',
            'package_snapshot' => ['features' => ['penilaian_juri'], 'options' => ['assessment_addon' => true]],
        ]);
    }

    private function cat(int $eventId, string $name): int
    {
        return DB::table('event_participant_categories')->insertGetId(['event_id' => $eventId, 'name' => $name, 'quota' => 50, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function system(int $eventId): void
    {
        DB::table('judging_systems')->insert(['event_id' => $eventId, 'category_id' => 0, 'system' => 'weighted', 'created_at' => now(), 'updated_at' => now()]);
    }

    /** @return array<int,int> peta nomor tim => id registrasi */
    private function regs(int $eventId, int $catId, string $pfx, array $teams): array
    {
        $out = [];
        foreach ($teams as $n) {
            $out[$n] = DB::table('event_registrations')->insertGetId([
                'user_id' => $this->users[$this->pool++ % count($this->users)], 'event_id' => $eventId,
                'participant_category_id' => $catId ?: null, 'school' => self::SCHOOLS[($n - 1) % 4],
                'contact_name' => "Tim $n ($pfx)", 'status' => 'terdaftar', 'reg_code' => "TES-$pfx-$n",
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        return $out;
    }

    /** Buat kriteria, 3 juri, peserta, dan nilai. $missTeam/$missJudge: tim yang tidak dinilai juri tertentu. */
    private function category(int $eventId, int $catId, string $pfx, array $teams, ?int $missTeam, int $missJudge): array
    {
        $regs = $this->regs($eventId, $catId, $pfx, $teams);

        $crit = [];
        foreach ([['Teknik', 60], ['Penampilan', 40]] as $i => [$name, $w]) {
            $crit[] = ['id' => DB::table('judging_criteria')->insertGetId([
                'event_id' => $eventId, 'category_id' => $catId, 'name' => $name, 'weight' => $w, 'max_score' => $w, 'sort' => $i,
                'created_at' => now(), 'updated_at' => now(),
            ]), 'max' => $w];
        }
        $judges = [];
        foreach ([1, 2, 3] as $j) {
            $judges[$j] = DB::table('judges')->insertGetId([
                'event_id' => $eventId, 'category_id' => $catId, 'name' => "Juri Tes $j ($pfx)", 'active' => 1,
                'token' => Str::random(32), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        foreach ($regs as $n => $rid) {
            foreach ($judges as $j => $jid) {
                if ($missTeam === $n && $missJudge === $j) {
                    continue;
                }
                foreach ($crit as $ci => $cr) {
                    $k = self::M[$n][$ci][$j - 1];
                    DB::table('judging_scores')->insert([
                        'event_id' => $eventId, 'judge_id' => $jid, 'registration_id' => $rid, 'criterion_id' => $cr['id'],
                        'score' => round($cr['max'] * $k / 5, 2), 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        }
        Judging::settings($eventId, $catId);
        DB::table('judging_settings')->where('event_id', $eventId)->where('category_id', $catId)->update([
            'enabled' => 1, 'scale' => 100, 'judge_count' => 3, 'avg_decimals' => 2, 'rounding' => 'nearest', 'updated_at' => now(),
        ]);

        return $regs;
    }
}
