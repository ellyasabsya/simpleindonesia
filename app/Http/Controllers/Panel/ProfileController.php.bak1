<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $i = $request->attributes->get('institution');

        return Inertia::render('panel/profil', [
            'institution' => [
                'id' => $i->id,
                'name' => $i->name,
                'email' => $i->email,
                'phone' => $i->phone,
                'description' => $i->description,
                'address' => $i->address,
                'website' => $i->website,
                'status' => $i->status,
                'logo_url' => $i->logo_path ? '/storage/' . ltrim($i->logo_path, '/') : null,
                'created_at' => $i->created_at?->toDateString(),
            ],
            'stats' => [
                'events' => Event::where('institution_id', $i->id)->count(),
                'published' => Event::where('institution_id', $i->id)->where('status', Event::PUBLISHED)->count(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $i = $request->attributes->get('institution');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
            'address' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'name.required' => 'Nama lembaga wajib diisi.',
            'email.required' => 'Email kontak wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'phone.required' => 'Nomor telepon wajib diisi.',
            'website.url' => 'Website harus diawali http:// atau https://',
            'logo.image' => 'Logo harus berupa gambar.',
            'logo.max' => 'Ukuran logo maksimal 2 MB.',
        ]);

        if ($request->hasFile('logo')) {
            if ($i->logo_path) {
                Storage::disk('public')->delete($i->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('logos', 'public');
        }
        unset($data['logo']);

        $i->forceFill($data)->save();

        return back()->with('success', 'Profil lembaga berhasil disimpan.');
    }
}
