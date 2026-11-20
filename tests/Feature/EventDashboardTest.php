<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function makeEventFor(User $user, string $status, array $features): Event
{
    $institution = Institution::where('user_id', $user->id)->first()
        ?? Institution::factory()->approved()->for($user)->create();

    return Event::create([
        'institution_id' => $institution->id,
        'title' => 'Event Uji '.uniqid(),
        'slug' => 'event-uji-'.uniqid(),
        'category' => 'seminar',
        'location' => 'Batam',
        'starts_at' => now()->addDays(3)->toDateString(),
        'ends_at' => now()->addDays(4)->toDateString(),
        'status' => $status,
        'package_snapshot' => ['name' => 'Ticketing', 'share_percent' => 10, 'features' => $features],
    ]);
}

it('shows the event dashboard with menus from the package snapshot', function () {
    $user = User::factory()->create();
    $event = makeEventFor($user, 'published', ['dashboard_event', 'tiket_multi', 'qr_checkin', 'laporan_gabungan']);

    actingAs($user)->get("/panel/event/{$event->id}")
        ->assertOk()
        ->assertInertia(fn ($p) => $p
            ->component('panel/events/show')
            ->where('eventNav.items', fn ($items) => collect($items)->pluck('key')->all() === ['dashboard', 'checkin', 'laporan', 'tiket']));
});

it('opens a menu that is part of the package', function () {
    $user = User::factory()->create();
    $event = makeEventFor($user, 'published', ['tiket_multi']);

    actingAs($user)->get("/panel/event/{$event->id}/tiket")->assertOk();
});

it('forbids a menu that is not in the package', function () {
    $user = User::factory()->create();
    $event = makeEventFor($user, 'published', ['tiket_multi']);

    actingAs($user)->get("/panel/event/{$event->id}/voting")->assertForbidden();
});

it('keeps feature menus closed until the event is published', function () {
    $user = User::factory()->create();
    $event = makeEventFor($user, 'pending', ['tiket_multi']);

    actingAs($user)->get("/panel/event/{$event->id}/tiket")->assertRedirect('/panel');
    actingAs($user)->get("/panel/event/{$event->id}")->assertRedirect('/panel');
});

it('hides events of other institutions', function () {
    $owner = User::factory()->create();
    $event = makeEventFor($owner, 'published', ['tiket_multi']);
    $other = User::factory()->create();
    Institution::factory()->approved()->for($other)->create();

    actingAs($other)->get("/panel/event/{$event->id}")->assertNotFound();
});
