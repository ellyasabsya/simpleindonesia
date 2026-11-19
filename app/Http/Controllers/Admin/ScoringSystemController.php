<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ScoringSystemController extends Controller
{
    public function index(): Response
    {
        $systems = DB::table('scoring_systems')->orderBy('id')->get()->map(function ($r) {
            return [
                'key' => $r->system_key,
                'name' => $r->name,
                'description' => (string) $r->description,
                'tag' => (string) $r->tag,
                'version' => (int) $r->version,
                'active' => (bool) $r->is_active,
                'used' => DB::table('judging_systems')->where('category_id', 0)->where('system', $r->system_key)->count(),
            ];
        })->values();

        return Inertia::render('admin/sistem-penilaian', ['systems' => $systems]);
    }

    public function update(Request $request, string $system): RedirectResponse
    {
        $row = DB::table('scoring_systems')->where('system_key', $system)->first();
        abort_unless($row, 404);
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
        ]);
        DB::table('scoring_systems')->where('system_key', $system)->update([
            'name' => trim($data['name']),
            'description' => trim((string) ($data['description'] ?? '')),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Sistem penilaian diperbarui.');
    }

    public function toggle(string $system): RedirectResponse
    {
        $row = DB::table('scoring_systems')->where('system_key', $system)->first();
        abort_unless($row, 404);
        $on = ! $row->is_active;
        DB::table('scoring_systems')->where('system_key', $system)->update(['is_active' => $on, 'updated_at' => now()]);

        return back()->with('success', $on
            ? 'Sistem penilaian diaktifkan. Panitia bisa memilihnya lagi.'
            : 'Sistem penilaian dinonaktifkan. Event yang sudah memakainya tetap berjalan.');
    }
}
