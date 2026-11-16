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
    public function store(Request $request): RedirectResponse
    {
        $institution = $request->attributes->get('institution');
        abort_unless($request->user()->id === $institution->user_id, 403, 'Hanya pemilik lembaga yang dapat menambah anggota.');

        $data = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'in:staf,admin'],
        ], [
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

        InstitutionMember::create(['institution_id' => $institution->id, 'user_id' => $user->id, 'role' => $data['role']]);

        return back();
    }

    public function destroy(Request $request, InstitutionMember $member): RedirectResponse
    {
        $institution = $request->attributes->get('institution');
        abort_unless($request->user()->id === $institution->user_id, 403);
        abort_unless($member->institution_id === $institution->id, 404);

        $member->delete();

        return back();
    }
}
