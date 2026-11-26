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

// Event 3 hari: 10, 11, 12 Desember 2026.
function dailyEvent(User $user): Event
{
    $institution = Institution::factory()->approved()->for($user)->create();

    return Event::create([
        'institution_id' => $institution->id,
        'title' => 'Event Harian '.uniqid(),
        'slug' => 'event-harian-'.uniqid(),
        'category' => 'seminar',
        'location' => 'Batam',
        'starts_at' => '2026-12-10',
        'ends_at' => '2026-12-12',
        'status' => 'published',
        'package_snapshot' => ['name' => 'Ticketing', 'share_percent' => 10, 'features' => ['dashboard_event', 'tiket_multi', 'qr_checkin']],
    ]);
}

function dailyAt(string $date): void
{
    Carbon::setTestNow(Carbon::parse($date.' 10:00:00', 'Asia/Jakarta'));
}

/** Buat satu tiket. Mengembalikan kode tiket. */
function dailyTicket(Event $e, string $audience, array $o = []): string
{
    $now = now();
    $typeId = DB::table('ticket_types')->insertGetId([
        'event_id' => $e->id, 'name' => 'Tiket '.Str::random(5), 'price' => 0, 'quota' => 100,
        'valid_from' => '2026-12-01', 'valid_until' => '2026-12-12', 'max_per_order' => 5,
        'valid_days' => $o['valid_days'] ?? 3, 'custom_sale' => 0, 'require_holder_details' => 0,
        'support_enabled' => 0, 'audience' => $audience, 'created_at' => $now, 'updated_at' => $now,
    ]);
    $orderId = DB::table('ticket_orders')->insertGetId([
        'event_id' => $e->id, 'ticket_type_id' => $typeId, 'code' => 'ORD'.Str::upper(Str::random(8)),
        'buyer_name' => 'Pembeli', 'buyer_email' => 'p'.Str::random(5).'@example.com', 'buyer_phone' => '0800',
        'quantity' => 1, 'subtotal' => 0, 'fee' => 0, 'total' => 0, 'fee_percent' => 0,
        'holders' => json_encode(['Pemegang']), 'status' => $o['status'] ?? 'lunas',
        'visit_date' => $o['visit_date'] ?? null, 'created_at' => $now, 'updated_at' => $now,
    ]);
    $code = 'TKT'.Str::upper(Str::random(10));
    DB::table('ticket_holders')->insert([
        'ticket_order_id' => $orderId, 'event_id' => $e->id, 'ticket_type_id' => $typeId, 'code' => $code,
        'holder_name' => 'Pemegang', 'visit_date' => $o['visit_date'] ?? null,
        'checked_in_at' => $o['checked_in_at'] ?? null, 'created_at' => $now, 'updated_at' => $now,
    ]);

    return $code;
}

function dailyScan(User $user, Event $e, string $code): string
{
    return actingAs($user)->postJson("/panel/event/{$e->id}/registrasi/checkin", ['code' => $code])
        ->assertOk()->json('status');
}

it('peserta lewat tiket: sekali per hari, sah selama event', function () {
    $user = User::factory()->create();
    $e = dailyEvent($user);
    $code = dailyTicket($e, 'peserta');

    dailyAt('2026-12-10');
    expect(dailyScan($user, $e, $code))->toBe('ok');
    expect(dailyScan($user, $e, $code))->toBe('duplikat');

    dailyAt('2026-12-11');
    expect(dailyScan($user, $e, $code))->toBe('ok');
    expect(dailyScan($user, $e, $code))->toBe('duplikat');

    dailyAt('2026-12-13');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');
    dailyAt('2026-12-09');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');

    expect(DB::table('daily_checkins')->count())->toBe(2);
    expect(DB::table('checkins')->count())->toBe(2);
});

it('peserta lewat tiket: pesanan belum lunas ditolak', function () {
    $user = User::factory()->create();
    $e = dailyEvent($user);
    $code = dailyTicket($e, 'peserta', ['status' => 'menunggu']);

    dailyAt('2026-12-10');
    expect(dailyScan($user, $e, $code))->toBe('belum_lunas');
    expect(DB::table('daily_checkins')->count())->toBe(0);
});

it('pengunjung tiket terusan 3 hari: ok tiap hari, ditolak di luar rentang', function () {
    $user = User::factory()->create();
    $e = dailyEvent($user);
    $code = dailyTicket($e, 'umum', ['valid_days' => 3]);

    foreach (['2026-12-10', '2026-12-11', '2026-12-12'] as $d) {
        dailyAt($d);
        expect(dailyScan($user, $e, $code))->toBe('ok');
        expect(dailyScan($user, $e, $code))->toBe('duplikat');
    }

    dailyAt('2026-12-13');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');
    dailyAt('2026-12-09');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');

    expect(DB::table('daily_checkins')->count())->toBe(3);
});

it('pengunjung tiket Hari 2: hanya sah di tanggalnya', function () {
    $user = User::factory()->create();
    $e = dailyEvent($user);
    $code = dailyTicket($e, 'umum', ['valid_days' => 1, 'visit_date' => '2026-12-11']);

    dailyAt('2026-12-10');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');

    dailyAt('2026-12-11');
    expect(dailyScan($user, $e, $code))->toBe('ok');
    expect(dailyScan($user, $e, $code))->toBe('duplikat');

    dailyAt('2026-12-12');
    expect(dailyScan($user, $e, $code))->toBe('salah_tanggal');
});

it('data lama: sudah check-in hari ini sebelum patch tetap duplikat, besoknya ok', function () {
    $user = User::factory()->create();
    $e = dailyEvent($user);
    dailyAt('2026-12-10');
    $code = dailyTicket($e, 'umum', ['valid_days' => 3, 'checked_in_at' => now()]);

    expect(DB::table('daily_checkins')->count())->toBe(0);
    expect(dailyScan($user, $e, $code))->toBe('duplikat');

    dailyAt('2026-12-11');
    expect(dailyScan($user, $e, $code))->toBe('ok');
});

it('database menolak baris harian ganda untuk orang dan tanggal yang sama', function () {
    $row = ['holder_type' => 'ticket', 'holder_id' => 1, 'visit_date' => '2026-12-10', 'created_at' => now(), 'updated_at' => now()];

    expect(DB::table('daily_checkins')->insertOrIgnore($row))->toBe(1);
    expect(DB::table('daily_checkins')->insertOrIgnore($row))->toBe(0);
    expect(DB::table('daily_checkins')->count())->toBe(1);
});
