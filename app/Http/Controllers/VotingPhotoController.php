<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/** Halaman publik: peserta mengunggah fotonya sendiri lewat link pribadi. */
class VotingPhotoController extends Controller
{
    private function find(string $token): object
    {
        $p = DB::table('voting_participants')->where('upload_token', $token)->first();
        abort_unless($p, 404);

        return $p;
    }

    public function show(string $token)
    {
        $p = $this->find($token);

        return Inertia::render('foto-peserta', [
            'token' => $token,
            'name' => $p->name,
            'description' => $p->description,
            'event' => (string) DB::table('events')->where('id', $p->event_id)->value('title'),
            'photo' => $p->photo ? '/storage/'.$p->photo : null,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $p = $this->find($token);
        $request->validate(
            ['photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072']],
            ['photo.required' => 'Pilih foto dulu.', 'photo.image' => 'File harus berupa gambar.', 'photo.mimes' => 'Foto harus JPG, PNG, atau WebP.', 'photo.max' => 'Ukuran foto maksimal 3 MB.']
        );

        $path = \App\Support\ImageUploader::store($request->file('photo'), "voting/{$p->event_id}", 'photo', 600);
        if ($p->photo) {
            Storage::disk('public')->delete($p->photo);
        }
        DB::table('voting_participants')->where('id', $p->id)->update(['photo' => $path, 'updated_at' => now()]);

        return back()->with('success', 'Foto berhasil disimpan. Terima kasih!');
    }
}
