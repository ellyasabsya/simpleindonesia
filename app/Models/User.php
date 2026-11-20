<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'phone', 'institution'];

    protected $hidden = ['password', 'remember_token', 'withdrawal_pin', 'pin_attempts', 'pin_locked_until', 'two_factor_secret', 'two_factor_recovery_codes'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function institutions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Institution::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
