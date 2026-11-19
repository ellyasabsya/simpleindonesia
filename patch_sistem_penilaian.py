import os

ROOT = os.environ.get("SK_ROOT", ".")


def p(*a):
    return os.path.join(ROOT, *a)


def read(path):
    return open(path, encoding="utf-8").read()


def once(text, old, new, label):
    n = text.count(old)
    assert n == 1, f"GAGAL [{label}]: ditemukan {n}x (harus 1). Tidak ada file yang diubah."
    return text.replace(old, new)


WEB = p("routes/web.php")
JC = p("app/Http/Controllers/Panel/JudgingController.php")
TSX = p("resources/js/pages/panel/events/penilaian.tsx")
NEW_CTRL = p("app/Http/Controllers/Admin/ScoringSystemController.php")
NEW_MIG = p("database/migrations/2026_11_19_300000_scoring_systems.php")
NEW_PAGE = p("resources/js/pages/admin/sistem-penilaian.tsx")

for f in (NEW_CTRL, NEW_MIG, NEW_PAGE):
    assert not os.path.exists(f), f"GAGAL: {f} sudah ada (patch ini sudah pernah dijalankan). Tidak ada file yang diubah."

web = read(WEB)
jc = read(JC)
tsx = read(TSX)

# ---------------- routes ----------------
web = once(web, "'penilaian' => 'Sistem Penilaian',", "", "route placeholder")
web = once(
    web,
    "Route::get('paket', [\\App\\Http\\Controllers\\Admin\\PackageController::class, 'index'])->name('paket.index');",
    "Route::get('paket', [\\App\\Http\\Controllers\\Admin\\PackageController::class, 'index'])->name('paket.index');\n"
    "        Route::get('penilaian', [\\App\\Http\\Controllers\\Admin\\ScoringSystemController::class, 'index'])->name('penilaian');\n"
    "        Route::patch('penilaian/{system}', [\\App\\Http\\Controllers\\Admin\\ScoringSystemController::class, 'update'])->where('system', '[a-z_]+')->name('penilaian.update');\n"
    "        Route::patch('penilaian/{system}/aktif', [\\App\\Http\\Controllers\\Admin\\ScoringSystemController::class, 'toggle'])->where('system', '[a-z_]+')->name('penilaian.toggle');",
    "route baru",
)

# ---------------- JudgingController ----------------
helpers = """/** Kunci sistem penilaian yang diaktifkan admin. Kalau tabel katalog belum ada, anggap semua aktif. */
    private function activeSystemKeys(): array
    {
        if (! \\Illuminate\\Support\\Facades\\Schema::hasTable('scoring_systems')) {
            return ['weighted'];
        }

        return DB::table('scoring_systems')->where('is_active', 1)->pluck('system_key')->all();
    }

    """
anchor = "/** Sistem penilaian terpilih untuk satu event. Event lama yang sudah punya data dianggap 'weighted'. */"
jc = once(jc, anchor, helpers + anchor, "jc helper")
jc = once(
    jc,
    "'systemLock' => $this->systemLockReason($event),",
    "'systemLock' => $this->systemLockReason($event),\n            'systemsActive' => $this->activeSystemKeys(),",
    "jc props",
)
jc = once(
    jc,
    "$data = $request->validate(['system' => 'nullable|in:weighted']);",
    "$data = $request->validate(['system' => 'nullable|in:weighted']);\n"
    "        if (($data['system'] ?? null) && ! in_array($data['system'], $this->activeSystemKeys(), true) && $this->systemOf($event) !== $data['system']) {\n"
    "            return back()->with('error', 'Sistem penilaian ini sedang dinonaktifkan oleh admin.');\n"
    "        }",
    "jc setSystem",
)

# ---------------- penilaian.tsx: sembunyikan pilihan kalau semua sistem nonaktif ----------------
wrapper = """import { usePage as usePageSys } from '@inertiajs/react';

type SistemPickerProps = { base: string; title: string; system: string | null; lockReason: string | null; onChosen: () => void };

function SistemPicker(p: SistemPickerProps) {
    const sysActive = ((usePageSys().props as any).systemsActive ?? null) as string[] | null;
    const hasChoice = sysActive === null || SYSTEMS.some((s) => !s.soon && sysActive.includes(s.key));
    if (!hasChoice && !p.system) {
        return (
            <div className={`${card} p-6 text-center`}>
                <h3 className="text-base font-extrabold">Belum ada sistem penilaian yang tersedia</h3>
                <p className="mt-1 text-sm text-slate-500">Sistem penilaian sedang dinonaktifkan oleh admin SIMPLE. Hubungi admin untuk mengaktifkannya.</p>
            </div>
        );
    }
    return <SistemPickerInner {...p} />;
}

"""
tsx = once(tsx, "function SistemPicker(", wrapper + "function SistemPickerInner(", "tsx picker")

# ---------------- file baru ----------------
ctrl = r"""<?php

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
"""

mig = r"""<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scoring_systems', function (Blueprint $t) {
            $t->id();
            $t->string('system_key', 30)->unique();
            $t->string('name', 120);
            $t->text('description')->nullable();
            $t->string('tag', 60)->nullable();
            $t->unsignedSmallInteger('version')->default(1);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        DB::table('scoring_systems')->insert([
            'system_key' => 'weighted',
            'name' => 'Penilaian Berbasis Bobot Nilai',
            'description' => 'Nilai akhir dari jumlah (nilai × bobot) tiap kriteria, dinilai beberapa juri. Cocok untuk lomba seni, vokal, tari, dan sejenisnya.',
            'tag' => 'Weighted · Bobot',
            'version' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('scoring_systems');
    }
};
"""

page = r"""import AdminLayout from '@/components/admin/admin-layout';
import { router } from '@inertiajs/react';
import { CheckSquare, Lock } from 'lucide-react';
import { useState } from 'react';

type Sys = { key: string; name: string; description: string; tag: string; version: number; active: boolean; used: number };

const box = 'rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';

function SystemCard({ s }: { s: Sys }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(s.name);
    const [desc, setDesc] = useState(s.description);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const save = () => {
        setErr('');
        router.patch(`/admin/penilaian/${s.key}`, { name, description: desc }, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => setOpen(false),
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan.')),
        });
    };
    const toggle = () => {
        const msg = s.active
            ? `Nonaktifkan "${s.name}"? Panitia tidak akan melihat pilihan ini di menu Penilaian.${s.used > 0 ? ` ${s.used} event yang sudah memakainya tetap berjalan.` : ''}`
            : `Aktifkan kembali "${s.name}"?`;
        if (!confirm(msg)) return;
        router.patch(`/admin/penilaian/${s.key}/aktif`, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    return (
        <div className={`${box} space-y-4 p-6 ${s.active ? '' : 'opacity-80'}`}>
            <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"><CheckSquare className="size-6" /></div>
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{s.tag || 'Sistem penilaian'}</div>
                    <h3 className="text-lg font-extrabold leading-snug">{s.name}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${s.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                    {s.active ? '● Aktif' : '○ Nonaktif'}
                </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">{s.description || 'Belum ada deskripsi.'}</p>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Versi</div>
                    <div className="mt-1 text-xl font-extrabold">{s.version}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Dipakai event</div>
                    <div className="mt-1 text-xl font-extrabold">{s.used}</div>
                </div>
            </div>

            {s.used > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                    <Lock className="size-3.5" /> Terkunci
                </span>
            )}

            {open && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    {s.used > 0 && <p className="text-xs font-semibold text-slate-500">Sudah dipakai event, jadi rumus dan versi tidak bisa diubah. Nama dan deskripsi masih bisa.</p>}
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">Nama sistem
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
                    </label>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">Deskripsi
                        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
                    </label>
                    {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
                    <div className="flex gap-2">
                        <button type="button" disabled={busy || name.trim() === ''} onClick={save} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50">Simpan</button>
                        <button type="button" onClick={() => { setOpen(false); setName(s.name); setDesc(s.description); setErr(''); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200">Batal</button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700">Detail / Edit</button>
                <button type="button" disabled={busy} onClick={toggle} className={`text-sm font-extrabold disabled:opacity-50 ${s.active ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                    {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
            </div>
        </div>
    );
}

export default function SistemPenilaian({ systems }: { systems: Sys[] }) {
    return (
        <AdminLayout title="Sistem Penilaian">
            <div className="space-y-5">
                <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 p-7 text-white shadow-lg">
                    <h2 className="text-3xl font-extrabold">Sistem Penilaian</h2>
                    <p className="mt-2 text-sm text-white/90">Kelola metode penilaian yang bisa dipilih panitia di menu Penilaian pada Dashboard Event. Kalau sebuah sistem dinonaktifkan, pilihannya tidak muncul lagi untuk panitia.</p>
                </div>
                <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                    {systems.map((s) => <SystemCard key={s.key} s={s} />)}
                </div>
                {systems.length === 0 && <p className={`${box} p-8 text-center text-sm font-semibold text-slate-500`}>Belum ada sistem penilaian. Jalankan php artisan migrate.</p>}
            </div>
        </AdminLayout>
    );
}
"""

os.makedirs(os.path.dirname(NEW_PAGE), exist_ok=True)
os.makedirs(os.path.dirname(NEW_CTRL), exist_ok=True)
os.makedirs(os.path.dirname(NEW_MIG), exist_ok=True)
for path, content in ((WEB, web), (JC, jc), (TSX, tsx), (NEW_CTRL, ctrl), (NEW_MIG, mig), (NEW_PAGE, page)):
    open(path, "w", encoding="utf-8").write(content)
print("ok: halaman admin Sistem Penilaian + tombol aktif/nonaktif + pengait ke menu Penilaian")
