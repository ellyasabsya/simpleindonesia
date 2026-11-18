<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Judging;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Data uji untuk event "Batam bernyanyi 2026" (sub-event id 2 dan 3).
 * Jalankan : php artisan db:seed --class=BatamBernyanyiJudgingSeeder
 * Bersihkan: php artisan tinker --execute="Database\Seeders\BatamBernyanyiJudgingSeeder::cleanup();"
 */
class BatamBernyanyiJudgingSeeder extends Seeder
{
    private const SUBS = [2, 3];
    // nilai k (1-5) per tim (urut), per juri 1-3. Tim 2 dan 3 SERI persis.
    private const M = [[5, 5, 4], [4, 4, 5], [4, 4, 5], [4, 3, 3], [3, 3, 2], [2, 2, 3]];
    private const SCHOOLS = ['SMA Negeri 1 Batam', 'SMA Negeri 5 Batam', 'Komunitas Musik Batam', 'Studio Nada Batam'];
    private const TEAMS = 6;

    public static function cleanup(): void
    {
        $judges = DB::table('judges')->where('name', 'like', 'TES Juri%')->pluck('id')->all();
        DB::table('judging_scores')->whereIn('judge_id', $judges)->delete();
        DB::table('judges')->whereIn('id', $judges)->delete();
        DB::table('judging_criteria')->whereIn('event_id', self::SUBS)->where('name', 'like', 'TES %')->delete();
        DB::table('event_registrations')->where('reg_code', 'like', 'TES-BB-%')->delete();
        DB::table('users')->where('email', 'like', 'tes-bb-%@example.test')->delete();

        // hasil uji dari UI: riwayat, penalti, keputusan seri, kunci, dan SK
        foreach (['judging_result_history', 'judging_penalties', 'judging_tie_decisions'] as $tb) {
            DB::table($tb)->whereIn('event_id', self::SUBS)->delete();
        }
        DB::table('judging_settings')->whereIn('event_id', self::SUBS)->update(['saved_at' => null, 'saved_by' => null, 'saved_version' => 0, 'finalized_at' => null, 'finalized_by' => null]);
        DB::table('judging_sk')->whereIn('event_id', [1, 2, 3])->delete();
    }

    public function run(): void
    {
        foreach (self::SUBS as $e) {
            if (! DB::table('events')->where('id', $e)->where('parent_id', 1)->exists()) {
                $this->command?->error("Event $e bukan sub-event dari event 1. Seeder dihentikan.");

                return;
            }
        }
        self::cleanup();

        $seq = 0;

        foreach (self::SUBS as $eid) {
            $pool = 0; // user tidak boleh dobel dalam satu event
            $cats = Judging::categories($eid);
            foreach ($cats as $ci => $k) {
                $cid = (int) $k['id'];
                $last = $ci === count($cats) - 1;

                // 1. lengkapi tim sampai 6
                $have = count(Judging::participants($eid, $cid));
                for ($n = $have + 1; $n <= self::TEAMS; $n++) {
                    DB::table('event_registrations')->insert([
                        'user_id' => User::factory()->create(['name' => 'Peserta Tes BB '.(++$seq), 'email' => "tes-bb-$seq@example.test"])->id, 'event_id' => $eid, 'participant_category_id' => $cid ?: null,
                        'school' => self::SCHOOLS[$n % 4], 'contact_name' => "TES Tim $n ({$k['name']})", 'status' => 'terdaftar',
                        'reg_code' => "TES-BB-$eid-$cid-$n", 'total_fee' => 0, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }

                // 2. kriteria hanya dibuat kalau kategori belum punya
                Judging::settings($eid, $cid);
                $newCrit = Judging::leaves($eid, $cid)->count() === 0;
                if ($newCrit) {
                    foreach ([['TES Teknik', 60], ['TES Penampilan', 40]] as $i => [$name, $w]) {
                        DB::table('judging_criteria')->insert([
                            'event_id' => $eid, 'category_id' => $cid, 'name' => $name, 'weight' => $w, 'max_score' => $w, 'sort' => $i,
                            'created_at' => now(), 'updated_at' => now(),
                        ]);
                    }
                }
                $upd = ['enabled' => 1, 'judge_count' => 3, 'updated_at' => now()];
                if ($newCrit) {
                    $upd['scale'] = 100;
                }
                DB::table('judging_settings')->where('event_id', $eid)->where('category_id', $cid)->update($upd);

                // 3. juri
                $judges = [];
                foreach ([1, 2, 3] as $j) {
                    $judges[$j] = DB::table('judges')->insertGetId([
                        'event_id' => $eid, 'category_id' => $cid, 'name' => "TES Juri $j ({$k['name']})", 'active' => 1,
                        'token' => Str::random(32), 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }

                // 4. nilai. Kategori terakhir di Karaoke: tim ke-6 belum dinilai juri 3.
                $leaves = Judging::leaves($eid, $cid);
                foreach (array_values(Judging::participants($eid, $cid)) as $i => $p) {
                    foreach ($judges as $j => $jid) {
                        if ($eid === self::SUBS[1] && $last && $i === 5 && $j === 3) {
                            continue;
                        }
                        foreach ($leaves as $c) {
                            DB::table('judging_scores')->insert([
                                'event_id' => $eid, 'judge_id' => $jid, 'registration_id' => $p['id'], 'criterion_id' => $c->id,
                                'score' => round($c->max_score * self::M[$i % self::TEAMS][$j - 1] / 5, 2),
                                'created_at' => now(), 'updated_at' => now(),
                            ]);
                        }
                    }
                }
                if ($prob = Judging::problems($eid, $cid)) {
                    $this->command?->warn("Event $eid kategori {$k['name']}: ".implode(' ', $prob));
                }
            }
        }

        $this->command?->info('Selesai. Token juri:');
        foreach (DB::table('judges')->where('name', 'like', 'TES Juri%')->get(['event_id', 'category_id', 'name', 'token']) as $j) {
            $this->command?->line("  event {$j->event_id} kat {$j->category_id} | {$j->name} | {$j->token}");
        }
        $this->command?->info('Event utama: /panel/event/1/penilaian');
    }
}
