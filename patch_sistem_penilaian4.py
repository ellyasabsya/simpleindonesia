import os

ROOT = os.environ.get("SK_ROOT", ".")


def p(*a):
    return os.path.join(ROOT, *a)


def once(text, old, new, label):
    n = text.count(old)
    assert n == 1, f"GAGAL [{label}]: ditemukan {n}x (harus 1). Tidak ada file yang diubah."
    return text.replace(old, new)


WEB = p("routes/web.php")
CTRL = p("app/Http/Controllers/Admin/ScoringSystemController.php")
PAGE = p("resources/js/pages/admin/sistem-penilaian.tsx")

assert os.path.exists(CTRL) and os.path.exists(PAGE) and os.path.exists(WEB), "GAGAL: jalankan patch_sistem_penilaian 1, 2, dan 3 dulu. Tidak ada file yang diubah."
old_ctrl = open(CTRL, encoding="utf-8").read()
assert "function store(" in old_ctrl, "GAGAL: patch_sistem_penilaian3.py belum dijalankan. Tidak ada file yang diubah."
assert "storeHook" not in old_ctrl, "GAGAL: patch ini sudah pernah dijalankan. Tidak ada file yang diubah."

web = open(WEB, encoding="utf-8").read()
web = once(
    web,
    r"""'hook' => '[a-z_]+'])->name('penilaian.hook');""",
    r"""'hook' => '[a-z_0-9]+'])->name('penilaian.hook');
        Route::post('penilaian/{system}/cantolan', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'storeHook'])->where('system', '[a-z_0-9]+')->name('penilaian.hook.store');""",
    "route",
)

NEW_CTRL = r'''<?php

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
'''

NEW_PAGE = r'''import AdminLayout from '@/components/admin/admin-layout';
import { router } from '@inertiajs/react';
import { CheckSquare, Lock, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type Hook = { key: string; label: string; description: string; enabled: boolean };
type Sys = { key: string; name: string; description: string; tag: string; version: number; active: boolean; used: number; hooks: Hook[] };
type Row = { label: string; key: string; description: string; touched: boolean };

const box = 'rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white';
const lbl = 'block text-xs font-extrabold uppercase tracking-wider text-slate-500';
const btnPrimary = 'rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50';
const btnGhost = 'rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[0-9_]+/, '').slice(0, 30);
const emptyRow = (): Row => ({ label: '', key: '', description: '', touched: false });

/** Pesan kesalahan kode cantolan, atau '' kalau aman. Server tetap memeriksa ulang. */
function keyError(key: string, taken: string[], others: string[]): string {
    if (key === '') return '';
    if (!/^[a-z][a-z0-9_]{1,29}$/.test(key)) return 'Huruf kecil, angka, dan garis bawah, diawali huruf (2 sampai 30 karakter).';
    if (taken.includes(key)) return 'Kode ini sudah dipakai. Cantolan harus baru.';
    if (others.includes(key)) return 'Kode kembar dengan cantolan lain di sistem ini.';
    return '';
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-extrabold">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="size-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function HookList({ hooks, busy, onToggle }: { hooks: Hook[]; busy?: string; onToggle: (k: string) => void }) {
    return (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {hooks.map((h) => (
                <li key={h.key}>
                    <label className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5 ${busy === h.key ? 'opacity-60' : ''}`}>
                        <input type="checkbox" checked={h.enabled} disabled={!!busy} onChange={() => onToggle(h.key)} className="size-5 shrink-0 accent-indigo-600" />
                        <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-extrabold ${h.enabled ? '' : 'text-slate-400 line-through'}`}>{h.label}</span>
                            <span className="block text-xs text-slate-500">{h.description || 'Tanpa keterangan.'} <span className="font-mono text-[11px] text-slate-400">({h.key})</span></span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${h.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{h.enabled ? 'Aktif' : 'Mati'}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}

function HookFields({ row, onChange, error }: { row: Row; onChange: (r: Row) => void; error: string }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>Nama cantolan
                <input value={row.label} maxLength={80} placeholder="mis. Skor Pertandingan" className={input}
                    onChange={(e) => onChange({ ...row, label: e.target.value, key: row.touched ? row.key : slug(e.target.value) })} />
            </label>
            <label className={lbl}>Kode cantolan
                <input value={row.key} maxLength={30} placeholder="mis. skor" className={`${input} font-mono ${error ? 'border-rose-400 dark:border-rose-400' : ''}`}
                    onChange={(e) => onChange({ ...row, key: e.target.value.toLowerCase(), touched: true })} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>Keterangan
                <input value={row.description} maxLength={200} placeholder="Tab atau aksi apa yang dikunci cantolan ini" className={input}
                    onChange={(e) => onChange({ ...row, description: e.target.value })} />
            </label>
            {error && <p className="text-xs font-bold text-rose-600 sm:col-span-2">{error}</p>}
        </div>
    );
}

function EditModal({ s, usedKeys, onClose }: { s: Sys; usedKeys: string[]; onClose: () => void }) {
    const [name, setName] = useState(s.name);
    const [tag, setTag] = useState(s.tag);
    const [desc, setDesc] = useState(s.description);
    const [busy, setBusy] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [row, setRow] = useState<Row>(emptyRow());
    const [adding, setAdding] = useState(false);
    const [hookErr, setHookErr] = useState('');
    const on = s.hooks.filter((h) => h.enabled).length;
    const rowError = keyError(row.key, usedKeys, []);

    const save = () => {
        setErr('');
        router.patch(`/admin/penilaian/${s.key}`, { name, tag, description: desc }, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: onClose,
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan.')),
        });
    };
    const toggleHook = (key: string) => {
        const h = s.hooks.find((x) => x.key === key);
        if (h?.enabled && !confirm(`Matikan cantolan "${h.label}"?\n\nTab ini hilang di menu Penilaian dan aksinya ditolak server untuk semua event yang memakai ${s.name}${s.used > 0 ? ` (${s.used} event saat ini)` : ''}.`)) return;
        router.patch(`/admin/penilaian/${s.key}/cantolan/${key}`, {}, { preserveScroll: true, onStart: () => setBusy(key), onFinish: () => setBusy('') });
    };
    const addHook = () => {
        setHookErr('');
        router.post(`/admin/penilaian/${s.key}/cantolan`, { label: row.label, key: row.key, description: row.description } as any, {
            preserveScroll: true,
            onStart: () => setAdding(true),
            onFinish: () => setAdding(false),
            onSuccess: () => setRow(emptyRow()),
            onError: (e) => setHookErr(String(Object.values(e)[0] ?? 'Gagal menambah cantolan.')),
        });
    };

    const statusCls = on === s.hooks.length && on > 0
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
        : on === 0
            ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'
            : 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200';
    const statusMsg = s.hooks.length === 0
        ? 'Sistem ini belum punya cantolan.'
        : on === s.hooks.length
            ? 'Semua cantolan aktif. Sistem berjalan penuh.'
            : on === 0
                ? 'Semua cantolan mati. Sistem lumpuh dan pilihannya tidak muncul untuk panitia.'
                : `${s.hooks.length - on} dari ${s.hooks.length} cantolan mati. Sistem berjalan terbatas.`;

    return (
        <Modal title="Detail / Edit sistem" onClose={onClose}>
            <div className="space-y-4">
                {s.used > 0 && <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">Sudah dipakai {s.used} event, jadi rumus dan versi tidak bisa diubah. Nama, deskripsi, dan cantolan masih bisa.</p>}
                <label className={lbl}>Nama sistem<input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={input} /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className={lbl}>Label<input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} className={input} /></label>
                    <div className={lbl}>Kode sistem<div className={`${input} bg-slate-50 text-slate-500 dark:bg-white/5`}>{s.key}</div></div>
                </div>
                <label className={lbl}>Deskripsi<textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className={input} /></label>
                {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
                <div className="flex gap-2">
                    <button type="button" disabled={saving || name.trim() === ''} onClick={save} className={btnPrimary}>Simpan perubahan</button>
                    <button type="button" onClick={onClose} className={btnGhost}>Tutup</button>
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cantolan (tab di menu Penilaian)</div>
                    <div className={`mt-2 rounded-2xl px-4 py-2.5 text-sm font-bold ${statusCls}`}>{statusMsg}</div>
                    <div className="mt-3"><HookList hooks={s.hooks} busy={busy} onToggle={toggleHook} /></div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-white/15">
                    <div className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">Tambah cantolan baru</div>
                    <HookFields row={row} onChange={setRow} error={rowError} />
                    {hookErr && <p className="mt-2 text-xs font-bold text-rose-600">{hookErr}</p>}
                    <button type="button" disabled={adding || row.label.trim() === '' || row.key === '' || rowError !== ''} onClick={addHook} className={`${btnPrimary} mt-3`}>Tambah cantolan</button>
                </div>
            </div>
        </Modal>
    );
}

function AddModal({ usedKeys, onClose }: { usedKeys: string[]; onClose: () => void }) {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [keyTouched, setKeyTouched] = useState(false);
    const [tag, setTag] = useState('');
    const [desc, setDesc] = useState('');
    const [rows, setRows] = useState<Row[]>([emptyRow()]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const errors = rows.map((r, i) => keyError(r.key, usedKeys, rows.filter((_, j) => j !== i).map((x) => x.key)));
    const valid = name.trim() !== '' && key.trim() !== '' && rows.every((r, i) => r.label.trim() !== '' && r.key !== '' && errors[i] === '');

    const submit = () => {
        setErr('');
        router.post('/admin/penilaian', {
            name, system_key: key, tag, description: desc,
            hooks: rows.map((r) => ({ label: r.label, key: r.key, description: r.description })),
        } as any, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: onClose,
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menambah sistem.')),
        });
    };

    return (
        <Modal title="Tambah sistem penilaian" onClose={onClose}>
            <div className="space-y-4">
                <label className={lbl}>Nama sistem
                    <input value={name} onChange={(e) => { setName(e.target.value); if (!keyTouched) setKey(slug(e.target.value)); }} maxLength={120} placeholder="mis. Penilaian Pertandingan" className={input} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className={lbl}>Kode sistem
                        <input value={key} onChange={(e) => { setKeyTouched(true); setKey(e.target.value.toLowerCase()); }} maxLength={30} placeholder="mis. match" className={`${input} font-mono`} />
                    </label>
                    <label className={lbl}>Label
                        <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} placeholder="mis. Olahraga" className={input} />
                    </label>
                </div>
                <label className={lbl}>Deskripsi<textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className={input} /></label>

                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cantolan sistem ini</div>
                    <p className="mb-3 mt-1 text-xs text-slate-500">Isi cantolan baru milik sistem ini. Cantolan yang sudah dipakai sistem lain tidak bisa dipakai lagi.</p>
                    <div className="space-y-3">
                        {rows.map((r, i) => (
                            <div key={i} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300">Cantolan {i + 1}</span>
                                    {rows.length > 1 && (
                                        <button type="button" onClick={() => setRows((v) => v.filter((_, j) => j !== i))} aria-label="Hapus cantolan" className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="size-4" /></button>
                                    )}
                                </div>
                                <HookFields row={r} error={errors[i]} onChange={(nr) => setRows((v) => v.map((x, j) => (j === i ? nr : x)))} />
                            </div>
                        ))}
                    </div>
                    {rows.length < 20 && (
                        <button type="button" onClick={() => setRows((v) => [...v, emptyRow()])} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-indigo-500/10"><Plus className="size-4" /> Tambah cantolan</button>
                    )}
                </div>

                <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">Sistem baru dibuat dalam keadaan nonaktif. Aktifkan lewat tombol Aktifkan di kartunya setelah siap.</p>
                {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
                <div className="flex gap-2">
                    <button type="button" disabled={busy || !valid} onClick={submit} className={btnPrimary}>Tambah sistem</button>
                    <button type="button" onClick={onClose} className={btnGhost}>Batal</button>
                </div>
            </div>
        </Modal>
    );
}

function SystemCard({ s, onEdit }: { s: Sys; onEdit: () => void }) {
    const [busy, setBusy] = useState(false);
    const on = s.hooks.filter((h) => h.enabled).length;
    const hookTone = s.hooks.length > 0 && on === s.hooks.length ? 'text-emerald-600 dark:text-emerald-300' : on === 0 ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300';

    const toggle = () => {
        const msg = s.active
            ? `Nonaktifkan "${s.name}"?\n\nPanitia tidak akan melihat pilihan ini di menu Penilaian.${s.used > 0 ? ` ${s.used} event yang sudah memakainya tetap berjalan.` : ''}`
            : `Aktifkan "${s.name}"? Panitia bisa memilihnya di menu Penilaian.`;
        if (!confirm(msg)) return;
        router.patch(`/admin/penilaian/${s.key}/aktif`, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    return (
        <div className={`${box} flex flex-col overflow-hidden`}>
            <div className={`h-1.5 ${s.active ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500' : 'bg-slate-300 dark:bg-white/15'}`} />
            <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${s.active ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-slate-400 shadow-slate-400/20'}`}><CheckSquare className="size-6" /></div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{s.tag || 'Sistem penilaian'}</div>
                        <h3 className="mt-0.5 text-lg font-extrabold leading-snug">{s.name}</h3>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${s.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                            {s.active ? '● Aktif' : '○ Nonaktif'}
                        </span>
                        {s.used > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:bg-amber-400/15 dark:text-amber-200"><Lock className="size-3" /> Terkunci</span>}
                    </div>
                </div>

                <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.description || 'Belum ada deskripsi.'}</p>

                <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/70 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
                    <div className="px-4 py-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Versi</div>
                        <div className="mt-1 text-xl font-extrabold">{s.version}</div>
                    </div>
                    <div className="px-4 py-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Dipakai event</div>
                        <div className="mt-1 text-xl font-extrabold">{s.used}</div>
                    </div>
                    <div className="px-4 py-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Cantolan</div>
                        <div className={`mt-1 text-xl font-extrabold ${hookTone}`}>{on}/{s.hooks.length}</div>
                    </div>
                </div>

                {s.hooks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {s.hooks.map((h) => (
                            <span key={h.key} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${h.enabled ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200' : 'bg-slate-100 text-slate-400 line-through dark:bg-white/5'}`}>{h.label}</span>
                        ))}
                    </div>
                )}

                <div className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                    <button type="button" onClick={onEdit} className="flex-1 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-indigo-700">Detail / Edit</button>
                    <button type="button" disabled={busy} onClick={toggle} className={`rounded-2xl border px-5 py-2.5 text-sm font-extrabold disabled:opacity-50 ${s.active ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:hover:bg-rose-500/10' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/30 dark:hover:bg-emerald-500/10'}`}>
                        {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SistemPenilaian({ systems, usedKeys }: { systems: Sys[]; usedKeys: string[] }) {
    const [editKey, setEditKey] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const editing = systems.find((x) => x.key === editKey) ?? null;

    return (
        <AdminLayout title="Sistem Penilaian">
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 p-7 text-white shadow-lg">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest"><span className="size-1.5 rounded-full bg-cyan-300" /> SIMPLE Platform Management</span>
                        <h2 className="mt-3 text-3xl font-extrabold">Sistem Penilaian</h2>
                        <p className="mt-2 text-sm text-white/90">Kelola metode penilaian yang dapat dipilih panitia pada Dashboard Event.</p>
                    </div>
                    <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 shadow hover:bg-indigo-50"><Plus className="size-4" /> Tambah Sistem</button>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {systems.map((s) => <SystemCard key={s.key} s={s} onEdit={() => setEditKey(s.key)} />)}
                </div>
                {systems.length === 0 && <p className={`${box} p-8 text-center text-sm font-semibold text-slate-500`}>Belum ada sistem penilaian. Jalankan php artisan migrate.</p>}
            </div>

            {editing && <EditModal key={editing.key} s={editing} usedKeys={usedKeys} onClose={() => setEditKey(null)} />}
            {adding && <AddModal usedKeys={usedKeys} onClose={() => setAdding(false)} />}
        </AdminLayout>
    );
}
'''

# Semua pemeriksaan lolos: baru tulis file.
open(WEB, "w", encoding="utf-8").write(web)
open(CTRL, "w", encoding="utf-8").write(NEW_CTRL)
open(PAGE, "w", encoding="utf-8").write(NEW_PAGE)
print("ok: Tambah Sistem memakai cantolan baru + tampilan kartu dirapikan")
