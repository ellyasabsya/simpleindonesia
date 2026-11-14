<?php

use App\Models\Package;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(fn () => $this->withoutVite());

it('blocks non admins', function () {
    actingAs(User::factory()->create())->get('/admin/paket')->assertForbidden();
});

it('creates a revenue share package with the chosen features', function () {
    actingAs(User::factory()->admin()->create())->post('/admin/paket', [
        'name' => 'Ticketing Pro',
        'payment_type' => 'revenue_share',
        'share_percent' => 10,
        'modules' => ['ticketing'],
        'features' => ['dashboard_event', 'ticket_sales', 'ticket_checkin', 'ticket_report'],
    ])->assertRedirect();

    $package = Package::where('slug', 'ticketing-pro')->firstOrFail();

    expect($package->share_percent)->toBe(10.0)
        ->and($package->features)->toHaveCount(4)
        // Check-in dan Laporan tiket membuka satu menu yang sama
        ->and($package->menus())->toBe(['dashboard', 'pengaturan-tiket', 'checkin-laporan']);
});

it('drops features whose module is not selected', function () {
    actingAs(User::factory()->admin()->create())->post('/admin/paket', [
        'name' => 'Tanpa Modul',
        'payment_type' => 'free',
        'modules' => [],
        'features' => ['dashboard_event', 'ticket_sales'],
    ]);

    expect(Package::where('slug', 'tanpa-modul')->first()->features)->toBe(['dashboard_event']);
});

it('requires a percentage for revenue share', function () {
    actingAs(User::factory()->admin()->create())
        ->post('/admin/paket', ['name' => 'X', 'payment_type' => 'revenue_share'])
        ->assertSessionHasErrors('share_percent');
});

it('updates and deletes a package', function () {
    $admin = User::factory()->admin()->create();
    $package = Package::create([
        'name' => 'Lama', 'slug' => 'lama', 'payment_type' => 'free', 'modules' => [], 'features' => [],
    ]);

    actingAs($admin)->patch("/admin/paket/{$package->id}", [
        'name' => 'Baru', 'payment_type' => 'upfront', 'price' => 250000, 'modules' => [], 'features' => [],
    ]);
    expect($package->fresh()->slug)->toBe('baru')->and($package->fresh()->price)->toBe(250000);

    actingAs($admin)->delete("/admin/paket/{$package->id}");
    expect(Package::count())->toBe(0);
});
