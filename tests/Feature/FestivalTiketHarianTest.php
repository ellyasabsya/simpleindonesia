<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());
afterEach(fn () => Carbon::setTestNow());

// Festival 3 hari: 10, 11, 12 Desember 2026. Total 1000 peserta (pengunjung).
const FESTIVAL_DAYS = ['2026-12-10', '2026-12-11', '2026-12-12'];
const FESTIVAL_QUOTA = [334, 333, 333]; // total 1000

function festivalEvent(User $user): Event
{
    $institution = Institution::factory()->approved()->for($user)->create();

    return Event::create([
        'institution_id' => $institution->id,
        'title' => 'Festival '.uniqid(),
        'slug' => 'festival-'.uniqid(),
        'category' => 'festival',
        'location' => 'Batam',
        'starts_at' => FESTIVAL_DAYS[0],
        'ends_at' => FESTIVAL_DAYS[2],
        'status' => 'published',
        'package_snapshot' => ['name' => 'Ticketing', 'share_percent' => 10, 'features' => ['dashboard_event', 'tiket_multi', 'qr_checkin']],
    ]);
}

function festivalAt(string $date): void
{
    Carbon::setTestNow(Carbon::parse($date.' 10:00:00', 'Asia/Jakarta'));
}

/**
 * Buat 3 jenis tiket pengunjung (Hari 1, 2, 3), masing-masing berlaku 1 hari,
 * lalu isi 1000 tiket lunas. Mengembalikan kode tiket per tanggal.
 *
 * @return array<string, array<int, string>>
 */
function festivalSeed(Event $e): array
{
    $now = now();
    $codes = [];

    foreach (FESTIVAL_DAYS as $i => $date) {
        $typeId = DB::table('ticket_types')->insertGetId([
            'event_id' => $e->id, 'name' => 'Tiket Pengunjung Hari '.($i + 1), 'price' => 0,
            'quota' => FESTIVAL_QUOTA[$i], 'valid_from' => '2026-12-01', 'valid_until' => $date,
            'max_per_order' => 5, 'valid_days' => 1, 'custom_sale' => 0, 'require_holder_details' => 0,
            'support_enabled' => 0, 'audience' => 'umum', 'created_at' => $now, 'updated_at' => $now,
        ]);

        for ($n = 0; $n < FESTIVAL_QUOTA[$i]; $n++) {
            $orderId = DB::table('ticket_orders')->insertGetId([
                'event_id' => $e->id, 'ticket_type_id' => $typeId, 'code' => 'ORD'.Str::upper(Str::random(10)),
                'buyer_name' => 'Pembeli', 'buyer_email' => 'p'.Str::random(8).'@example.com', 'buyer_phone' => '0800',
                'quantity' => 1, 'subtotal' => 0, 'fee' => 0, 'total' => 0, 'fee_percent' => 0,
                'holders' => json_encode(['Pengunjung']), 'status' => 'lunas',
                'visit_date' => $date, 'created_at' => $now, 'updated_at' => $now,
            ]);
            $code = 'TKT'.Str::upper(Str::random(12));
            DB::table('ticket_holders')->insert([
                'ticket_order_id' => $orderId, 'event_id' => $e->id, 'ticket_type_id' => $typeId, 'code' => $code,
                'holder_name' => 'Pengunjung', 'visit_date' => $date, 'checked_in_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $codes[$date][] = $code;
        }
    }

    return $codes;
}

function festivalScan(User $user, Event $e, string $code): string
{
    return actingAs($user)->postJson("/panel/event/{$e->id}/registrasi/checkin", ['code' => $code])
        ->assertOk()->json('status');
}

it('festival 3 hari: 1000 tiket pengunjung terbuat, 3 jenis tiket per hari', function () {
    $user = User::factory()->create();
    $e = festivalEvent($user);
    $codes = festivalSeed($e);

    expect(DB::table('ticket_holders')->where('event_id', $e->id)->count())->toBe(1000);
    expect(DB::table('ticket_types')->where('event_id', $e->id)->count())->toBe(3);
    expect(DB::table('ticket_types')->where('event_id', $e->id)->sum('quota'))->toBe(1000);

    foreach (FESTIVAL_DAYS as $i => $date) {
        expect(count($codes[$date]))->toBe(FESTIVAL_QUOTA[$i]);
    }
});

it('tiket per hari hanya sah di tanggalnya, di hari lain salah_tanggal', function () {
    $user = User::factory()->create();
    $e = festivalEvent($user);
    $codes = festivalSeed($e);

    $hari1 = $codes['2026-12-10'][0];
    $hari2 = $codes['2026-12-11'][0];
    $hari3 = $codes['2026-12-12'][0];

    festivalAt('2026-12-10');
    expect(festivalScan($user, $e, $hari1))->toBe('ok');
    expect(festivalScan($user, $e, $hari2))->toBe('salah_tanggal');
    expect(festivalScan($user, $e, $hari3))->toBe('salah_tanggal');

    festivalAt('2026-12-11');
    expect(festivalScan($user, $e, $hari2))->toBe('ok');
    expect(festivalScan($user, $e, $hari1))->toBe('salah_tanggal'); // tiket Hari 1 hangus

    festivalAt('2026-12-12');
    expect(festivalScan($user, $e, $hari3))->toBe('ok');

    festivalAt('2026-12-13');
    expect(festivalScan($user, $e, $hari3))->toBe('salah_tanggal');
    festivalAt('2026-12-09');
    expect(festivalScan($user, $e, $hari1))->toBe('salah_tanggal');
});

it('scan kedua pada tiket yang sama di hari yang sama adalah duplikat', function () {
    $user = User::factory()->create();
    $e = festivalEvent($user);
    $codes = festivalSeed($e);

    festivalAt('2026-12-11');
    $code = $codes['2026-12-11'][5];

    expect(festivalScan($user, $e, $code))->toBe('ok');
    expect(festivalScan($user, $e, $code))->toBe('duplikat');
    expect(festivalScan($user, $e, $code))->toBe('duplikat');

    expect(DB::table('daily_checkins')->count())->toBe(1);
});

it('gerbang penuh: 1000 pengunjung masuk sesuai harinya, tiap orang tercatat sekali', function () {
    $user = User::factory()->create();
    $e = festivalEvent($user);
    $codes = festivalSeed($e);

    foreach (FESTIVAL_DAYS as $i => $date) {
        festivalAt($date);

        foreach ($codes[$date] as $code) {
            expect(festivalScan($user, $e, $code))->toBe('ok');
        }

        // jumlah check-in kumulatif sampai hari ini
        $expected = array_sum(array_slice(FESTIVAL_QUOTA, 0, $i + 1));
        expect(DB::table('daily_checkins')->count())->toBe($expected);
    }

    expect(DB::table('daily_checkins')->count())->toBe(1000);
    expect(DB::table('checkins')->count())->toBe(1000);

    // setelah festival selesai, semua tiket ditolak
    festivalAt('2026-12-13');
    expect(festivalScan($user, $e, $codes['2026-12-12'][0]))->toBe('salah_tanggal');
});

it('pesanan belum lunas ditolak walau tanggalnya benar', function () {
    $user = User::factory()->create();
    $e = festivalEvent($user);
    $codes = festivalSeed($e);

    $code = $codes['2026-12-10'][0];
    DB::table('ticket_orders')
        ->whereIn('id', DB::table('ticket_holders')->where('code', $code)->pluck('ticket_order_id'))
        ->update(['status' => 'menunggu']);

    festivalAt('2026-12-10');
    expect(festivalScan($user, $e, $code))->toBe('belum_lunas');
    expect(DB::table('daily_checkins')->count())->toBe(0);
});
