<?php

use App\Models\Institution;
use App\Models\User;
use App\Notifications\InstitutionSubmitted;
use Illuminate\Support\Facades\Notification;

use function Pest\Laravel\actingAs;

it('blocks non admins', function () {
    actingAs(User::factory()->create())->get('/admin/lembaga')->assertForbidden();
});

it('paginates ten per page', function () {
    Institution::factory()->count(25)->create();

    actingAs(User::factory()->admin()->create())
        ->get('/admin/lembaga?status=pending&page=3')
        ->assertInertia(fn ($page) => $page
            ->component('admin/lembaga')
            ->has('institutions.data', 5)
            ->where('institutions.total', 25)
            ->where('counts.pending', 25));
});

it('filters by status and searches lembaga and member', function () {
    $member = User::factory()->create(['name' => 'Lipai']);
    Institution::factory()->approved()->for($member)->create(['name' => 'Kampung Melayu']);
    Institution::factory()->create(['name' => 'Ell Group']);

    $admin = User::factory()->admin()->create();

    actingAs($admin)->get('/admin/lembaga?status=approved')
        ->assertInertia(fn ($p) => $p->has('institutions.data', 1));
    actingAs($admin)->get('/admin/lembaga?status=all&search=lipai')
        ->assertInertia(fn ($p) => $p->has('institutions.data', 1)->where('institutions.data.0.name', 'Kampung Melayu'));
});

it('notifies every admin when a lembaga is submitted', function () {
    Notification::fake();
    $admins = User::factory()->admin()->count(2)->create();
    $member = User::factory()->create();

    actingAs($member)->post('/lembaga', [
        'name' => 'Lembaga Baru',
        'email' => 'baru@example.com',
        'phone' => '0812345678',
    ])->assertRedirect();

    Notification::assertSentTo($admins, InstitutionSubmitted::class);
    Notification::assertNotSentTo($member, InstitutionSubmitted::class);
});

it('approves, revokes and marks notifications read', function () {
    $admin = User::factory()->admin()->create();
    $institution = Institution::factory()->create();
    $admin->notify(new InstitutionSubmitted($institution));

    actingAs($admin)->patch("/admin/lembaga/{$institution->id}/approve")->assertRedirect();
    expect($institution->fresh()->status)->toBe('approved');

    actingAs($admin)->patch("/admin/lembaga/{$institution->id}/revoke")->assertRedirect();
    expect($institution->fresh()->status)->toBe('pending');

    expect($admin->unreadNotifications()->count())->toBe(1);
    actingAs($admin)->post('/admin/notifications/read-all')->assertRedirect();
    expect($admin->unreadNotifications()->count())->toBe(0);
});
