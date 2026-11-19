<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScoringSystemController extends Controller
{
    /** Kunci tab bawaan menu Penilaian. Tidak boleh dipakai sebagai cantolan sistem baru. */
    private const RESERVED = ['sistem', 'juri', 'nilai', 'publikasi', 'rekap', 'sk'];

    /** Semua kode cantolan yang sudah terpakai: tab bawaan ditambah cantolan semua sistem. */
    private function takenKeys(): array
    {
        return array_values(array_unique(array_merge(
            self::RESERVED,
            DB::table('scoring_system_hooks')->pluck('hook_key')->all()
        )));
    }

    /** Cantolan baru harus benar-benar baru, tidak boleh memakai kode yang sudah ada. */
    private function assertNewKeys(array $keys, string $field): void
    {
        $taken = $this->takenKeys();
        foreach ($keys as $k) {
            if (in_array($k, $taken, true)) {
                throw ValidationException::withMessages([
                    $field => 'Kode cantolan "'.$k.'" sudah dipakai. Cantolan harus baru, tidak boleh sama dengan yang sudah ada.',
                ]);
            }
        }
    }

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
            'usedKeys' => $this->takenKeys(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'system_key' => ['required', 'regex:/^[a-z][a-z0-9_]{1,29}$/', Rule::unique('scoring_systems', 'system_key')],
            'tag' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:500',
            'hooks' => 'required|array|min:1|max:20',
            'hooks.*.label' => 'required|string|max:80',
            'hooks.*.key' => ['required', 'regex:/^[a-z][a-z0-9_]{1,29}$/', 'distinct'],
            'hooks.*.description' => 'nullable|string|max:200',
        ], [
            'system_key.regex' => 'Kode sistem hanya huruf kecil, angka, dan garis bawah, diawali huruf.',
            'system_key.unique' => 'Kode sistem sudah dipakai.',
            'hooks.required' => 'Tambahkan minimal satu cantolan baru.',
            'hooks.min' => 'Tambahkan minimal satu cantolan baru.',
            'hooks.*.label.required' => 'Nama cantolan wajib diisi.',
            'hooks.*.key.required' => 'Kode cantolan wajib diisi.',
            'hooks.*.key.regex' => 'Kode cantolan hanya huruf kecil, angka, dan garis bawah, diawali huruf.',
            'hooks.*.key.distinct' => 'Kode cantolan tidak boleh kembar dalam satu sistem.',
        ]);

        $this->assertNewKeys(array_column($data['hooks'], 'key'), 'hooks');

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
            foreach (array_values($data['hooks']) as $i => $h) {
                DB::table('scoring_system_hooks')->insert([
                    'system_key' => $data['system_key'],
                    'hook_key' => $h['key'],
                    'label' => trim($h['label']),
                    'description' => trim((string) ($h['description'] ?? '')),
                    'sort' => $i + 1,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
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

    public function storeHook(Request $request, string $system): RedirectResponse
    {
        abort_unless(DB::table('scoring_systems')->where('system_key', $system)->exists(), 404);
        $data = $request->validate([
            'label' => 'required|string|max:80',
            'key' => ['required', 'regex:/^[a-z][a-z0-9_]{1,29}$/'],
            'description' => 'nullable|string|max:200',
        ], [
            'label.required' => 'Nama cantolan wajib diisi.',
            'key.required' => 'Kode cantolan wajib diisi.',
            'key.regex' => 'Kode cantolan hanya huruf kecil, angka, dan garis bawah, diawali huruf.',
        ]);

        $this->assertNewKeys([$data['key']], 'key');

        $sort = (int) DB::table('scoring_system_hooks')->where('system_key', $system)->max('sort');
        DB::table('scoring_system_hooks')->insert([
            'system_key' => $system,
            'hook_key' => $data['key'],
            'label' => trim($data['label']),
            'description' => trim((string) ($data['description'] ?? '')),
            'sort' => $sort + 1,
            'is_enabled' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Cantolan "'.trim($data['label']).'" ditambahkan.');
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
