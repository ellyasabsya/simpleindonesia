<?php

use App\Models\User;

it('does not serialize withdrawal pin or two-factor secrets', function () {
    $user = User::factory()->create()->fresh();

    expect(array_keys($user->toArray()))->not->toContain(
        'withdrawal_pin',
        'pin_attempts',
        'pin_locked_until',
        'two_factor_secret',
        'two_factor_recovery_codes',
    );
});
