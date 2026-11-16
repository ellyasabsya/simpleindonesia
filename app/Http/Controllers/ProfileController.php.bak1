<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\User;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        return Inertia::render('profil/edit');
    }

    public function show(Request $request, string $username)
    {
        $person = User::where('username', $username)->firstOrFail();
        $me = $request->user();
        $link = DB::table('friendships')->where('user_id', $me->id)->where('friend_id', $person->id)->where('status', 'accepted')->first();

        return Inertia::render('profil/show', [
            'person' => array_merge($person->only(['id', 'name', 'username', 'avatar', 'bio', 'city', 'created_at']), ['socials' => json_decode($person->socials ?? '[]', true) ?: (object) []]),
            'isMe' => $me->id === $person->id,
            'isFriend' => (bool) $link,
            'since' => $link?->created_at,
            'friendsCount' => DB::table('friendships')->where('user_id', $person->id)->where('status', 'accepted')->count(),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['nullable', 'alpha_dash', 'max:30', Rule::unique('users', 'username')->ignore($user->id)],
            'bio' => ['nullable', 'string', 'max:300'],
            'city' => ['nullable', 'string', 'max:80'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'socials' => ['nullable', 'array'],
            'socials.*' => ['nullable', 'string', 'max:100'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            $data['avatar'] = Storage::url($request->file('avatar')->store('avatars', 'public'));
        } else {
            unset($data['avatar']);
        }

        $data['socials'] = json_encode(array_filter($data['socials'] ?? [], fn ($v) => filled($v)));
        $user->forceFill($data)->save();

        return redirect('/dashboard')->with('success', 'Profil diperbarui.');
    }

    public function addFriend(Request $request)
    {
        $request->validate(['code' => ['required', 'string', 'max:300']]);
        $key = basename(parse_url(trim($request->code), PHP_URL_PATH) ?: $request->code);

        $friend = User::where('username', $key)->when(ctype_digit($key), fn ($q) => $q->orWhere('id', $key))->first();
        if (! $friend || $friend->id === $request->user()->id) {
            return back()->withErrors(['code' => 'Pengguna tidak ditemukan.']);
        }

        $already = DB::table('friendships')->where('user_id', $request->user()->id)->where('friend_id', $friend->id)->exists();

        foreach ([[$request->user()->id, $friend->id], [$friend->id, $request->user()->id]] as [$a, $b]) {
            DB::table('friendships')->updateOrInsert(
                ['user_id' => $a, 'friend_id' => $b],
                ['status' => 'accepted', 'created_at' => now(), 'updated_at' => now()],
            );
        }

        if (! $already) {
            $friend->notify(new \App\Notifications\FriendAdded($request->user()));
        }

        return back()->with('success', "Anda berteman dengan {$friend->name}.");
    }
}
