<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function gateEvent(User $user, array $features): Event
{
    $institution = Institution::where('user_id', $user->id)->first()
        ?? Institution::factory()->approved()->for($user)->create();

    return Event::create([
        'institution_id' => $institution->id,
        'title' => 'Event Gate '.uniqid(),
        'slug' => 'event-gate-'.uniqid(),
        'category' => 'seminar',
        'location' => 'Batam',
        'starts_at' => now()->addDays(3)->toDateString(),
        'ends_at' => now()->addDays(4)->toDateString(),
        'status' => 'published',
        'package_snapshot' => ['name' => 'Uji', 'share_percent' => 10, 'features' => $features],
    ]);
}

it('closes voting settings when the package has no voting feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event']);

    actingAs($user)->get("/panel/event/{$event->id}/voting")->assertForbidden();
});

it('opens voting settings when the package includes voting', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'voting_event']);

    actingAs($user)->get("/panel/event/{$event->id}/voting")->assertOk();
});

it('closes judging settings when the package has no judging feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'voting_event']);

    actingAs($user)->get("/panel/event/{$event->id}/penilaian")->assertForbidden();
});

it('closes the standings page when the package has no judging feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'voting_event']);

    actingAs($user)->get("/panel/event/{$event->id}/klasemen")->assertForbidden();
});

it('opens judging settings when the package includes judging', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'penilaian_juri']);

    actingAs($user)->get("/panel/event/{$event->id}/penilaian")->assertOk();
});

it('closes ticket settings when the package has no ticket feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'registrasi_peserta']);

    actingAs($user)->post("/panel/event/{$event->id}/tiket/jenis", [])->assertForbidden();
});

it('closes series ticket status when the package has no ticket feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'registrasi_peserta']);

    actingAs($user)->get("/panel/event/{$event->id}/tiket/rangkaian")->assertForbidden();
});

it('closes check-in scan when the package has no check-in feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'registrasi_peserta', 'tiket_multi']);

    actingAs($user)->post("/panel/event/{$event->id}/registrasi/checkin", [])->assertForbidden();
});

it('does not block ticket settings when the package has the ticket feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'tiket_multi']);

    $status = actingAs($user)->post("/panel/event/{$event->id}/tiket/jenis", [])->status();
    expect($status)->not->toBe(403);
});

it('does not block check-in scan when the package has the check-in feature', function () {
    $user = User::factory()->create();
    $event = gateEvent($user, ['dashboard_event', 'qr_checkin']);

    $status = actingAs($user)->post("/panel/event/{$event->id}/registrasi/checkin", [])->status();
    expect($status)->not->toBe(403);
});
