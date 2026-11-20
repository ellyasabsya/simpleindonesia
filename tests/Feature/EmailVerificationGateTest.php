<?php

use App\Models\Institution;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

it('redirects unverified users from the panel to email verification', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    Institution::factory()->approved()->for($user)->create();

    actingAs($user)->get('/panel')->assertRedirect('/email/verify');
});

it('lets verified users into the panel', function () {
    $user = User::factory()->create();
    Institution::factory()->approved()->for($user)->create();

    actingAs($user)->get('/panel')->assertOk();
});

it('blocks unverified users from creating a payment token', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    Institution::factory()->approved()->for($user)->create();

    actingAs($user)->post('/midtrans/event-token/1')->assertRedirect('/email/verify');
});
