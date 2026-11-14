<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\InstitutionSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class LembagaController extends Controller
{
    public function create(Request $request): Response
    {
        $institution = $request->user()->institutions()->latest()->first();

        return Inertia::render('lembaga/daftar', [
            'institution' => $institution?->only('name', 'email', 'phone', 'status', 'created_at'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Satu akun cukup satu pendaftaran aktif
        if ($request->user()->institutions()->whereIn('status', ['pending', 'approved'])->exists()) {
            return redirect()->route('lembaga.daftar');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
        ], [
            'name.required' => 'Nama lembaga wajib diisi.',
            'email.required' => 'Email kontak wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'phone.required' => 'Nomor telepon wajib diisi.',
        ]);

        $institution = $request->user()->institutions()->create($data + ['status' => 'pending']);

        Notification::send(User::where('role', 'admin')->get(), new InstitutionSubmitted($institution));

        return redirect()->route('lembaga.daftar');
    }
}
