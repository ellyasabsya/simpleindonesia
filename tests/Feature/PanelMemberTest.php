<?php

use App\Models\Institution;
use App\Models\InstitutionMember;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function memberOwner(): array
{
    $owner = User::factory()->create();
    $institution = Institution::factory()->approved()->for($owner)->create();

    return [$owner, $institution];
}

it('adds a registered user as a member', function () {
    [$owner, $institution] = memberOwner();
    $staff = User::factory()->create(['email' => 'staf@contoh.com']);

    actingAs($owner)->post('/panel/anggota', ['email' => 'staf@contoh.com', 'role' => 'staf'])->assertRedirect();

    expect(InstitutionMember::where('institution_id', $institution->id)->where('user_id', $staff->id)->exists())->toBeTrue();
});

it('rejects unknown, duplicate and owner emails', function () {
    [$owner] = memberOwner();
    $staff = User::factory()->create(['email' => 'staf@contoh.com']);

    actingAs($owner)->post('/panel/anggota', ['email' => 'tidak@ada.com', 'role' => 'staf'])->assertSessionHasErrors('email');
    actingAs($owner)->post('/panel/anggota', ['email' => $owner->email, 'role' => 'staf'])->assertSessionHasErrors('email');

    actingAs($owner)->post('/panel/anggota', ['email' => $staff->email, 'role' => 'admin']);
    actingAs($owner)->post('/panel/anggota', ['email' => $staff->email, 'role' => 'admin'])->assertSessionHasErrors('email');
});

it('removes a member', function () {
    [$owner, $institution] = memberOwner();
    $member = InstitutionMember::create(['institution_id' => $institution->id, 'user_id' => User::factory()->create()->id, 'role' => 'staf']);

    actingAs($owner)->delete("/panel/anggota/{$member->id}")->assertRedirect();
    expect(InstitutionMember::count())->toBe(0);
});

it('shows the panel hub with counts', function () {
    [$owner] = memberOwner();

    actingAs($owner)->get('/panel')->assertOk()
        ->assertInertia(fn ($p) => $p->component('panel/dashboard')->where('isOwner', true)->where('counts.total', 0));
});
