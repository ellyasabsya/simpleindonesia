<?php

use App\Models\Event;
use App\Models\Institution;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function dashEvent(Institution $i, string $status, string $days = '+3 days'): Event
{
    return Event::create([
        'institution_id' => $i->id,
        'title' => 'Event '.uniqid(),
        'slug' => 'event-'.uniqid(),
        'category' => 'seminar',
        'location' => 'Batam',
        'starts_at' => now()->modify($days)->toDateString(),
        'ends_at' => now()->modify($days)->toDateString(),
        'status' => $status,
        'package_snapshot' => ['name' => 'Ticketing', 'features' => []],
    ]);
}

it('requires login', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

it('sends admins to the admin area', function () {
    actingAs(User::factory()->admin()->create())->get('/dashboard')->assertRedirect('/admin');
});

it('shows a fresh user their first steps', function () {
    actingAs(User::factory()->create())->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($p) => $p
            ->component('dashboard')
            ->where('hasPanel', false)
            ->where('summary.total', 0)
            ->where('institutionCount', 0));
});

it('summarises only the user events', function () {
    $user = User::factory()->create();
    $mine = Institution::factory()->approved()->for($user)->create();
    dashEvent($mine, 'published');
    dashEvent($mine, 'published', '+9 days');
    dashEvent($mine, 'pending');
    dashEvent($mine, 'rejected');

    $other = Institution::factory()->approved()->for(User::factory()->create())->create();
    dashEvent($other, 'published');

    actingAs($user)->get('/dashboard')->assertInertia(fn ($p) => $p
        ->where('hasPanel', true)
        ->where('summary.total', 4)
        ->where('summary.published', 2)
        ->where('summary.pending', 1)
        ->where('summary.rejected', 1)
        ->where('summary.publishRate', 50));
});

it('marks a pending institution as not ready for the panel', function () {
    $user = User::factory()->create();
    Institution::factory()->for($user)->create();

    actingAs($user)->get('/dashboard')->assertInertia(fn ($p) => $p
        ->where('hasPanel', false)
        ->where('institutionCount', 1));
});
