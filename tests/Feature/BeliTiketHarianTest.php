<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

beforeEach(fn () => $this->withoutVite());
afterEach(fn () => Carbon::setTestNow());

const BELI_DAYS = ['2026-12-10', '2026-12-11', '2026-12-12'];
const BELI_QUOTA = [334, 333, 333]; // total 1000

function beliEvent(User $user): Event
{
    $institution = Institution::factory()->approved()->for($user)->create();

    $e = Event::create([
        'institution_id' => $institution->id,
        'title' => 'Festival '.uniqid(),
        'slug' => 'festival-'.uniqid(),
        'category' => 'festival',
        'location' => 'Batam',
        'starts_at' => BELI_DAYS[0],
        'ends_at' => BELI_DAYS[2],
        'status' => 'published',
        'package_snapshot' => ['name' => 'Ticketing', 'share_percent' => 10, 'features' => ['dashboard_event', 'tiket_multi', 'qr_checkin']],
    ]);

    // Kolom ini mungkin tidak ada di $fillable, jadi diisi lewat query.
    DB::table('events')->where('id', $e->id)->update(['registration_method' => 'ticket', 'ticket_sales_open' => 1]);

    return $e->fresh();
}

function beliAt(string $date): void
{
    Carbon::setTestNow(Carbon::parse($date.' 10:00:00', 'Asia/Jakarta'));
}

/** URL pembelian dicari dari daftar route, supaya tidak perlu menebak. */
function beliUrl(Event $e): string
{
    $r = collect(Route::getRoutes()->getRoutes())
        ->first(fn ($r) => str_ends_with($r->getActionName(), 'TicketPurchaseController@store'));
    expect($r)->not->toBeNull();

    return '/'.ltrim(str_replace('{event}', (string) $e->getRouteKey(), $r->uri()), '/');
}

function beliPayload(int $day, string $extra = ''): array
{
    return [
        'name' => 'Pengunjung Hari '.($day + 1).$extra,
        'audience' => 'umum',
        'price' => 0,
        'quota' => BELI_QUOTA[$day],
        'valid_days' => 1,
        'valid_date' => BELI_DAYS[$day],
        'custom_sale' => false,
        'require_holder_details' => false,
        'max_per_order' => 5,
        'support_enabled' => false,
    ];
}

/** Panitia membuat 3 jenis tiket lewat form pengaturan. Mengembalikan id jenis per tanggal. */
function beliCreateTypes(User $user, Event $e): array
{
    $ids = [];
    foreach (BELI_DAYS as $i => $date) {
        actingAs($user)->post("/panel/event/{$e->id}/tiket/jenis", beliPayload($i))->assertSessionHasNoErrors();
        $ids[$date] = (int) DB::table('ticket_types')->where('event_id', $e->id)->where('name', 'Pengunjung Hari '.($i + 1))->value('id');
    }

    return $ids;
}

function beliBuy(Event $e, int $typeId, int $qty, string $tag)
{
    $holders = [];
    for ($i = 1; $i <= $qty; $i++) {
        $holders[] = "Pengunjung {$tag} {$i}";
    }

    return post(beliUrl($e), [
        'ticket_type_id' => $typeId,
        'quantity' => $qty,
        'buyer_name' => 'Pembeli '.$tag,
        'buyer_email' => "pembeli-{$tag}@example.com",
        'buyer_phone' => '0800',
        'holders' => $holders,
    ]);
}

function beliScan(User $user, Event $e, string $code): string
{
    return actingAs($user)->postJson("/panel/event/{$e->id}/registrasi/checkin", ['code' => $code])
        ->assertOk()->json('status');
}

it('panitia membuat 3 jenis tiket per hari dan hari berlakunya tersimpan', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');

    $ids = beliCreateTypes($user, $e);

    foreach (BELI_DAYS as $i => $date) {
        $t = DB::table('ticket_types')->where('id', $ids[$date])->first();
        expect(json_decode((string) $t->valid_dates, true))->toBe([$date]);
        expect((int) $t->valid_days)->toBe(1);
        expect($t->audience)->toBe('umum');
        expect((int) $t->quota)->toBe(BELI_QUOTA[$i]);
    }
    expect(array_sum(BELI_QUOTA))->toBe(1000);
});

it('pembeli membeli tiket per hari: visit_date terisi otomatis dan tiket terbit', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');
    $ids = beliCreateTypes($user, $e);

    foreach (BELI_DAYS as $i => $date) {
        beliBuy($e, $ids[$date], 3, 'h'.($i + 1))->assertSessionHasNoErrors();

        $order = DB::table('ticket_orders')->where('ticket_type_id', $ids[$date])->first();
        expect($order)->not->toBeNull();
        expect(substr((string) $order->visit_date, 0, 10))->toBe($date);
        expect($order->status)->toBe('lunas');

        $holders = DB::table('ticket_holders')->where('ticket_type_id', $ids[$date])->get();
        expect($holders)->toHaveCount(3);
        foreach ($holders as $h) {
            expect(substr((string) $h->visit_date, 0, 10))->toBe($date);
        }
    }
});

it('tiket hasil pembelian sah hanya di harinya saat discan panitia', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');
    $ids = beliCreateTypes($user, $e);

    $codes = [];
    foreach (BELI_DAYS as $i => $date) {
        beliBuy($e, $ids[$date], 2, 'h'.($i + 1))->assertSessionHasNoErrors();
        $codes[$date] = DB::table('ticket_holders')->where('ticket_type_id', $ids[$date])->pluck('code')->all();
        expect($codes[$date])->toHaveCount(2);
    }

    foreach (BELI_DAYS as $date) {
        beliAt($date);

        foreach ($codes as $d => $list) {
            foreach ($list as $code) {
                if ($d === $date) {
                    expect(beliScan($user, $e, $code))->toBe('ok');
                    expect(beliScan($user, $e, $code))->toBe('duplikat');
                } else {
                    expect(beliScan($user, $e, $code))->toBe($d < $date ? 'salah_tanggal' : 'salah_tanggal');
                }
            }
        }
    }

    expect(DB::table('daily_checkins')->count())->toBe(6);
});

it('tiket hari yang sudah lewat tidak bisa dibeli', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');
    $ids = beliCreateTypes($user, $e);

    beliAt('2026-12-11');
    beliBuy($e, $ids['2026-12-10'], 1, 'telat')->assertSessionHasErrors('visit_date');

    expect(DB::table('ticket_orders')->where('ticket_type_id', $ids['2026-12-10'])->count())->toBe(0);
});

it('batas maksimal tiket per pesanan ditolak', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');
    $ids = beliCreateTypes($user, $e);

    beliBuy($e, $ids['2026-12-10'], 6, 'banyak')->assertSessionHasErrors('quantity');

    expect(DB::table('ticket_orders')->where('ticket_type_id', $ids['2026-12-10'])->count())->toBe(0);
});

it('hari berlaku tidak bisa diubah setelah ada pesanan', function () {
    $user = User::factory()->create();
    $e = beliEvent($user);
    beliAt('2026-12-01');
    $ids = beliCreateTypes($user, $e);

    beliBuy($e, $ids['2026-12-10'], 1, 'kunci')->assertSessionHasNoErrors();

    $ubah = beliPayload(0);
    $ubah['valid_date'] = '2026-12-12';
    actingAs($user)->put("/panel/event/{$e->id}/tiket/jenis/{$ids['2026-12-10']}", $ubah)
        ->assertSessionHasErrors('valid_date');

    $t = DB::table('ticket_types')->where('id', $ids['2026-12-10'])->first();
    expect(json_decode((string) $t->valid_dates, true))->toBe(['2026-12-10']);
});
