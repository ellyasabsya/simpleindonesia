<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScoringSystemController extends Controller
{
    /** Cantolan standar: tab di menu Penilaian panitia. Kuncinya sama dengan kunci tab di halaman penilaian. */
    private const HOOKS = [
        ['juri', 'Juri', 'Kelola juri, undangan, dan link penilaian juri.'],
        ['nilai', 'Pengaturan penilaian', 'Skala, kriteria, bobot, pengurangan nilai, dan pengesahan kategori.'],
        ['publikasi', 'Publikasi', 'Publikasi hasil dan klasemen ke peserta.'],
        ['rekap', 'Rekap nilai', 'Rekap nilai, unduhan Excel, dan lembar penilaian.'],
        ['sk', 'Penetapan & SK', 'Penetapan hasil dan surat keputusan.'],
    ];

    public function index(): Response
    {
        $hooks = DB::table('scoring_system_hooks')->orderBy('sort')->orderBy('id')->get()->groupBy('system_key');

        $systems = DB::table('scoring_systems')->orderBy('id')->get()->map(function ($r) use ($hooks) {
            return [
                'key' => $r->system_key,
                'name' => $r->name,
                'description' => (string) $r->description,
                'tag' => (string) $r->tag,
                'version' => (int) $r->version,
                'active' => (bool) $r->is_active,
                'used' => DB::table('judging_systems')->where('category_id', 0)->where('system', $r->system_key)->count(),
                'hooks' => ($hooks[$r->system_key] ?? collect())->map(fn ($h) => [
                    'key' => $h->hook_key,
                    'label' => $h->label,
                    'description' => (string) $h->description,
                    'enabled' => (bool) $h->is_enabled,
                ])->values(),
            ];
        })->values();

        return Inertia::render('admin/sistem-penilaian', [
            'systems' => $systems,
            'catalog' => collect(self::HOOKS)->map(fn ($h) => ['key' => $h[0], 'label' => $h[1], 'description' => $h[2]])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $keys = array_column(self::HOOKS, 0);
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'system_key' => ['required', 'regex:/^[a-z][a-z0-9_]{1,29}$/', Rule::unique('scoring_systems', 'system_key')],
            'tag' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:500',
            'hooks' => 'nullable|array',
            'hooks.*' => ['string', Rule::in($keys)],
        ], [
            'system_key.regex' => 'Kode sistem hanya huruf kecil, angka, dan garis bawah, diawali huruf.',
            'system_key.unique' => 'Kode sistem sudah dipakai.',
        ]);

        DB::transaction(function () use ($data) {
            DB::table('scoring_systems')->insert([
                'system_key' => $data['system_key'],
                'name' => trim($data['name']),
                'description' => trim((string) ($data['description'] ?? '')),
                'tag' => trim((string) ($data['tag'] ?? '')),
                'version' => 1,
                // Sistem baru nonaktif dulu. Admin mengaktifkannya setelah cantolannya siap.
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $on = $data['hooks'] ?? [];
            foreach (self::HOOKS as $i => [$key, $label, $desc]) {
                DB::table('scoring_system_hooks')->insert([
                    'system_key' => $data['system_key'], 'hook_key' => $key, 'label' => $label, 'description' => $desc,
                    'sort' => $i + 1, 'is_enabled' => in_array($key, $on, true), 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Sistem penilaian ditambahkan dan masih nonaktif. Aktifkan setelah cantolannya siap.');
    }

    public function update(Request $request, string $system): RedirectResponse
    {
        abort_unless(DB::table('scoring_systems')->where('system_key', $system)->exists(), 404);
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'tag' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:500',
        ]);
        DB::table('scoring_systems')->where('system_key', $system)->update([
            'name' => trim($data['name']),
            'tag' => trim((string) ($data['tag'] ?? '')),
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
            ? 'Sistem penilaian diaktifkan. Panitia bisa memilihnya.'
            : 'Sistem penilaian dinonaktifkan. Event yang sudah memakainya tetap berjalan.');
    }

    public function toggleHook(string $system, string $hook): RedirectResponse
    {
        $row = DB::table('scoring_system_hooks')->where('system_key', $system)->where('hook_key', $hook)->first();
        abort_unless($row, 404);
        $on = ! $row->is_enabled;
        DB::table('scoring_system_hooks')->where('id', $row->id)->update(['is_enabled' => $on, 'updated_at' => now()]);

        return back()->with('success', $row->label.($on ? ' diaktifkan.' : ' dimatikan.'));
    }
}
