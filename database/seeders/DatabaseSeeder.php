<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@simple.test'],
            [
                'name' => 'Admin SIMPLE',
                'password' => 'GantiPasswordIni123',
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
