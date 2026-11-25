<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $g = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            report($e);
            return redirect('/login')->withErrors(['email' => 'Login Google gagal. Coba lagi.']);
        }

        $user = User::where('google_id', $g->getId())
            ->orWhere('email', $g->getEmail())
            ->first() ?? new User();

        if (! $user->exists) {
            $user->forceFill([
                'name' => $g->getName() ?: 'Pengguna',
                'email' => $g->getEmail(),
                'password' => Hash::make(Str::random(40)),
                'role' => 'user',
            ]);
        }

        $user->forceFill([
            'google_id' => $g->getId(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        Auth::login($user, true);

        return redirect('/dashboard');
    }
}
