<?php

use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

function profileOwner(): array
{
    $user = User::factory()->create();
    $institution = Institution::factory()->approved()->for($user)->create();

    return [$user, $institution];
}

it('shows the profile to an approved institution', function () {
    [$user] = profileOwner();

    actingAs($user)->get('/panel/profil')->assertOk()
        ->assertInertia(fn ($p) => $p->component('panel/profil')->has('institution.name'));
});

it('updates the profile and stores the logo', function () {
    Storage::fake('public');
    [$user, $institution] = profileOwner();

    actingAs($user)->post('/panel/profil', [
        'name' => 'Nama Baru',
        'email' => 'baru@lembaga.com',
        'phone' => '08123456789',
        'address' => 'Batam',
        'website' => 'https://lembaga.com',
        'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
    ])->assertRedirect();

    $fresh = $institution->fresh();
    expect($fresh->name)->toBe('Nama Baru')->and($fresh->address)->toBe('Batam');
    Storage::disk('public')->assertExists($fresh->logo_path);
});

it('validates required fields and website', function () {
    [$user] = profileOwner();

    actingAs($user)->post('/panel/profil', ['name' => '', 'email' => 'x', 'phone' => '', 'website' => 'bukan-url'])
        ->assertSessionHasErrors(['name', 'email', 'phone', 'website']);
});

it('blocks institutions that are not approved', function () {
    $user = User::factory()->create();
    Institution::factory()->for($user)->create();

    actingAs($user)->get('/panel/profil')->assertRedirect('/lembaga/daftar');
});
