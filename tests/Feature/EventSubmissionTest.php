<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\Package;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function ticketing(): Package
{
    return Package::create([
        'name' => 'Ticketing', 'slug' => 'ticketing', 'payment_type' => 'revenue_share', 'share_percent' => 10,
        'modules' => ['ticketing'], 'features' => ['dashboard_event', 'ticket_sales', 'ticket_checkin', 'ticket_report'],
    ]);
}

function payload(Package $package, array $over = []): array
{
    return array_merge([
        'title' => 'Batam Bernyanyi 2026',
        'category' => 'perlombaan',
        'location' => 'Ballroom Hotel Pacific',
        'starts_at' => now()->addDays(7)->toDateString(),
        'ends_at' => now()->addDays(8)->toDateString(),
        'package_id' => $package->id,
    ], $over);
}

function organizer(): User
{
    $user = User::factory()->create();
    Institution::factory()->approved()->for($user)->create();

    return $user;
}

it('submits an event with a package snapshot and poster', function () {
    Storage::fake('public');
    $package = ticketing();

    actingAs(organizer())
        ->post('/panel/ajukan', payload($package, ['poster' => UploadedFile::fake()->image('poster.jpg', 400, 500)]))
        ->assertRedirect('/panel/event');

    $event = Event::firstOrFail();
    expect($event->status)->toBe('pending')
        ->and($event->slug)->toBe('batam-bernyanyi-2026')
        ->and($event->package_snapshot['share_percent'])->toEqual(10)
        ->and($event->menus())->toBe(['dashboard', 'pengaturan-tiket', 'checkin-laporan']);

    Storage::disk('public')->assertExists($event->poster_path);
});

it('keeps the snapshot when the package changes later', function () {
    $package = ticketing();
    actingAs(organizer())->post('/panel/ajukan', payload($package));

    $package->update(['share_percent' => 25, 'features' => ['dashboard_event']]);

    $event = Event::firstOrFail();
    expect($event->package_snapshot['share_percent'])->toEqual(10)
        ->and($event->hasFeature('ticket_checkin'))->toBeTrue();
});

it('validates dates and inactive packages', function () {
    $package = ticketing();
    $inactive = Package::create(['name' => 'Off', 'slug' => 'off', 'payment_type' => 'free', 'modules' => [], 'features' => [], 'is_active' => false]);
    $user = organizer();

    actingAs($user)->post('/panel/ajukan', payload($package, ['starts_at' => now()->subDay()->toDateString()]))
        ->assertSessionHasErrors('starts_at');
    actingAs($user)->post('/panel/ajukan', payload($package, ['ends_at' => now()->addDay()->toDateString()]))
        ->assertSessionHasErrors('ends_at');
    actingAs($user)->post('/panel/ajukan', payload($inactive))->assertSessionHasErrors('package_id');
});

it('blocks users without an approved institution', function () {
    $user = User::factory()->create();
    Institution::factory()->for($user)->create();

    actingAs($user)->post('/panel/ajukan', payload(ticketing()))->assertRedirect('/lembaga/daftar');
    expect(Event::count())->toBe(0);
});

it('lets an admin publish or reject with a reason', function () {
    $package = ticketing();
    actingAs(organizer())->post('/panel/ajukan', payload($package));
    $event = Event::firstOrFail();
    $admin = User::factory()->admin()->create();

    actingAs($admin)->patch("/admin/events/{$event->id}/reject", [])->assertSessionHasErrors('reason');
    actingAs($admin)->patch("/admin/events/{$event->id}/reject", ['reason' => 'Poster tidak sesuai.']);
    expect($event->fresh()->status)->toBe('rejected')->and($event->fresh()->rejection_reason)->toBe('Poster tidak sesuai.');

    actingAs($admin)->patch("/admin/events/{$event->id}/approve");
    expect($event->fresh()->status)->toBe('published')->and($event->fresh()->rejection_reason)->toBeNull();
});

it('blocks non admins from reviewing events', function () {
    actingAs(User::factory()->create())->get('/admin/review')->assertForbidden();
});
