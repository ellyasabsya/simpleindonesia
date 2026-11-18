<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/** Data uji sementara. Jalankan: php artisan db:seed --class=VotingSeeder (event lain: SEED_EVENT_ID=3 ...) */
class VotingSeeder extends Seeder
{
    public function run(): void
    {
        $eid = (int) env('SEED_EVENT_ID', 5);
        if (! DB::table('events')->where('id', $eid)->exists()) {
            $this->command?->error("Event {$eid} tidak ditemukan.");

            return;
        }
        $now = now();

        // bersihkan data voting lama untuk event ini
        foreach (['voting_orders', 'voting_gifts', 'voting_participants', 'voting_categories'] as $t) {
            DB::table($t)->where('event_id', $eid)->delete();
        }
        DB::table('voting_settings')->where('event_id', $eid)->delete();

        DB::table('voting_settings')->insert([
            'event_id' => $eid, 'enabled' => 1, 'price_per_vote' => 1000, 'min_votes' => 1,
            'message_enabled' => 1, 'message_max' => 100, 'sound_min_votes' => 5,
            'show_sender' => 1, 'show_ranking' => 1, 'show_votes' => 1,
            'vote_start' => $now->copy()->subDays(2)->toDateString(),
            'vote_end' => $now->copy()->addDays(14)->toDateString(),
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $cats = [];
        foreach (['Band', 'Solo', 'Dance'] as $i => $n) {
            $cats[$n] = DB::table('voting_categories')->insertGetId(['event_id' => $eid, 'name' => $n, 'sort' => $i + 1, 'created_at' => $now, 'updated_at' => $now]);
        }

        $colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444'];
        $people = [
            ['Band Merah', 'Band', 'Rock dari Batam Center'], ['Band Pinky', 'Band', 'Pop manis penuh warna'],
            ['Band Udara', 'Band', 'Indie santai'], ['Band Sudut', 'Band', 'Alternatif'],
            ['Rina Solo', 'Solo', 'Vokal jazz'], ['Dewi Dance', 'Dance', 'Tari kontemporer'],
            ['Crew Garuda', 'Dance', 'Hip hop crew'],
        ];
        $pids = [];
        foreach ($people as $i => [$name, $cat, $desc]) {
            $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="'.$colors[$i % 7].'"/><circle cx="200" cy="190" r="90" fill="rgba(255,255,255,.25)"/><text x="200" y="225" font-family="Arial,sans-serif" font-size="100" font-weight="700" text-anchor="middle" fill="#fff">'.mb_strtoupper(mb_substr($name, 0, 1)).'</text><text x="200" y="400" font-family="Arial,sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="#fff">'.e($name).'</text></svg>';
            $path = "voting/{$eid}/seed-".($i + 1).'.svg';
            Storage::disk('public')->put($path, $svg);
            $pids[] = DB::table('voting_participants')->insertGetId([
                'event_id' => $eid, 'category_id' => $cats[$cat], 'name' => $name, 'description' => $desc, 'active' => 1,
                'sort' => $i + 1, 'photo' => $path, 'upload_token' => Str::random(32), 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $gifts = [['🔥', 'Api', 10, 10000], ['🐻', 'Beruang', 20, 20000], ['🚀', 'Roket', 50, 50000], ['🦁', 'Singa', 100, 100000]];
        $gids = [];
        foreach ($gifts as [$e, $n, $v, $p]) {
            $gids[] = DB::table('voting_gifts')->insertGetId(['event_id' => $eid, 'emoji' => $e, 'name' => $n, 'votes' => $v, 'price' => $p, 'active' => 1, 'created_at' => $now, 'updated_at' => $now]);
        }

        // [peserta idx, gift idx|null, votes, nama, email, pesan, status]
        $orders = [
            [0, 3, 100, 'Ellyas', 'ellyas@example.com', 'Ayo pecahkan, mana auramu!', 'lunas'],
            [0, 2, 50, 'Budi', 'budi@example.com', 'Semangat Merah!', 'lunas'],
            [1, 2, 50, 'Siti', 'siti@example.com', 'Pinky juara', 'lunas'],
            [1, null, 15, 'Ellyas', 'ellyas@example.com', null, 'lunas'],
            [2, 1, 20, 'Andi', 'andi@example.com', 'Udara terbang tinggi', 'lunas'],
            [3, 0, 10, 'Dina', 'dina@example.com', null, 'lunas'],
            [4, 1, 20, 'Fajar', 'fajar@example.com', 'Suaranya juara', 'lunas'],
            [5, 2, 50, 'Maya', 'maya@example.com', 'Tarianmu keren!', 'lunas'],
            [6, 0, 10, 'Eko', 'eko@example.com', null, 'lunas'],
            [0, null, 7, 'Rudi', 'rudi@example.com', 'Lanjut!', 'lunas'],
            [2, 0, 10, 'Tono', 'tono@example.com', null, 'menunggu_verifikasi'],
            [5, 1, 20, 'Lia', 'lia@example.com', 'Semoga menang', 'menunggu_verifikasi'],
        ];
        foreach ($orders as $i => [$pi, $gi, $votes, $name, $email, $msg, $status]) {
            DB::table('voting_orders')->insert([
                'code' => strtoupper(Str::random(10)), 'event_id' => $eid, 'participant_id' => $pids[$pi],
                'gift_id' => $gi === null ? null : $gids[$gi], 'buyer_name' => $name, 'buyer_email' => $email,
                'votes' => $votes, 'amount' => $gi === null ? $votes * 1000 : $gifts[$gi][3], 'message' => $msg,
                'status' => $status, 'payment_proof' => null, 'paid_at' => $status === 'lunas' ? $now : null,
                'created_at' => $now->copy()->subMinutes(count($orders) - $i), 'updated_at' => $now,
            ]);
        }

        $this->command?->info("Seeder voting selesai untuk event {$eid}.");
    }
}
