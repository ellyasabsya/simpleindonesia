<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\InstitutionMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    public const ROLES = ['admin', 'manajer', 'keuangan', 'staf'];
    public const PERMS = ['events', 'checkin', 'finance', 'withdraw', 'members'];
    public const ROLE_PERMS = [
        'admin' => ['events', 'checkin', 'finance', 'withdraw', 'members'],
        'manajer' => ['events', 'checkin'],
        'keuangan' => ['finance', 'withdraw'],
        'staf' => ['checkin'],
    ];

    /** Hak akses tersimpan; kalau belum ada, pakai bawaan dari peran. */
    public static function permissionsFor(InstitutionMember $m): array
    {
        $raw = $m->getAttributes()['permissions'] ?? null;
        $list = $raw ? json_decode($raw, true) : null;

        return is_array($list) ? array_values($list) : (self::ROLE_PERMS[$m->role] ?? []);
    }

    private function rules(): array
    {
        return [
            'role' => ['required', 'in:' . implode(',', self::ROLES)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['in:' . implode(',', self::PERMS)],
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $institution = $request->attributes->get('institution');
        abort_unless($request->user()->id === $institution->user_id, 403, 'Hanya pemilik lembaga yang dapat menambah anggota.');

        $data = $request->validate(['email' => ['required', 'email']] + $this->rules(), [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['email' => 'Email ini belum terdaftar di SIMPLE.']);
        }
        if ($user->id === $institution->user_id) {
            throw ValidationException::withMessages(['email' => 'Akun ini adalah pemilik lembaga.']);
        }
        if (InstitutionMember::where('institution_id', $institution->id)->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['email' => 'Akun ini sudah menjadi anggota.']);
        }

        $member = InstitutionMember::create(['institution_id' => $institution->id, 'user_id' => $user->id, 'role' => $data['role']]);
        $member->forceFill(['permissions' => json_encode(array_values($data['permissions'] ?? self::ROLE_PERMS[$data['role']]))])->save();

        return back()->with('success', "{$user->name} ditambahkan ke lembaga.");
    }

    public function update(Request $request, InstitutionMember $member): RedirectResponse
    {
        $institution = $request->attributes->get('institution');
        abort_unless($request->user()->id === $institution->user_id, 403);
        abort_unless($member->institution_id === $institution->id, 404);

        $data = $request->validate($this->rules());
        $member->forceFill([
            'role' => $data['role'],
            'permissions' => json_encode(array_values($data['permissions'] ?? [])),
        ])->save();

        return back()->with('success', 'Hak akses diperbarui.');
    }

    public function destroy(Request $request, InstitutionMember $member): RedirectResponse
    {
        $institution = $request->attributes->get('institution');
        abort_unless($request->user()->id === $institution->user_id, 403);
        abort_unless($member->institution_id === $institution->id, 404);

        $member->delete();

        return back()->with('success', 'Anggota dikeluarkan.');
    }
}
