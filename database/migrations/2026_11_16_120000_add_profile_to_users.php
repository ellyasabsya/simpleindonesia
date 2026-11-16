<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $cols = [
            'username' => fn (Blueprint $t) => $t->string('username')->nullable(),
            'avatar' => fn (Blueprint $t) => $t->string('avatar')->nullable(),
            'bio' => fn (Blueprint $t) => $t->text('bio')->nullable(),
            'city' => fn (Blueprint $t) => $t->string('city')->nullable(),
            'phone' => fn (Blueprint $t) => $t->string('phone')->nullable(),
            'birth_date' => fn (Blueprint $t) => $t->date('birth_date')->nullable(),
            'instagram' => fn (Blueprint $t) => $t->string('instagram')->nullable(),
        ];

        foreach ($cols as $name => $add) {
            if (! Schema::hasColumn('users', $name)) {
                Schema::table('users', fn (Blueprint $t) => $add($t));
            }
        }

        if (! collect(Schema::getIndexes('users'))->contains(fn ($i) => $i['columns'] === ['username'])) {
            Schema::table('users', fn (Blueprint $t) => $t->unique('username'));
        }

        if (! Schema::hasTable('friendships')) {
            Schema::create('friendships', function (Blueprint $t) {
                $t->id();
                $t->foreignId('user_id')->constrained()->cascadeOnDelete();
                $t->foreignId('friend_id')->constrained('users')->cascadeOnDelete();
                $t->string('status')->default('accepted');
                $t->timestamps();
                $t->unique(['user_id', 'friend_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};
