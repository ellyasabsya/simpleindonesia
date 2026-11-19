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
CTRL = p("app/Http/Controllers/Admin/ScoringSystemController.php")
PAGE = p("resources/js/pages/admin/sistem-penilaian.tsx")
MIG = p("database/migrations/2026_11_19_310000_scoring_system_hooks.php")

assert os.path.exists(CTRL) and os.path.exists(PAGE), "GAGAL: jalankan patch_sistem_penilaian.py dulu. Tidak ada file yang diubah."
assert not os.path.exists(MIG), "GAGAL: patch ini sudah pernah dijalankan. Tidak ada file yang diubah."

web = read(WEB)
jc = read(JC)
tsx = read(TSX)

# ---------------- routes ----------------
web = once(
    web,
    r"Route::patch('penilaian/{system}', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'update'])->where('system', '[a-z_]+')->name('penilaian.update');",
    r"Route::patch('penilaian/{system}/cantolan/{hook}', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'toggleHook'])->where(['system' => '[a-z_]+', 'hook' => '[a-z_]+'])->name('penilaian.hook');",
    "route update",
)
web = once(
    web,
    r"Route::patch('penilaian/{system}/aktif', [\App\Http\Controllers\Admin\ScoringSystemController::class, 'toggle'])->where('system', '[a-z_]+')->name('penilaian.toggle');",
    "",
    "route toggle",
)

# ---------------- JudgingController ----------------
jc = once(
    jc,
    "return DB::table('scoring_systems')->where('is_active', 1)->pluck('system_key')->all();",
    "$keys = DB::table('scoring_systems')->where('is_active', 1)->pluck('system_key')->all();\n"
    "        if (! \\Illuminate\\Support\\Facades\\Schema::hasTable('scoring_system_hooks')) {\n"
    "            return $keys;\n"
    "        }\n\n"
    "        // Sistem yang semua cantolannya dimatikan dianggap lumpuh: pilihannya tidak ditawarkan.\n"
    "        return array_values(array_filter($keys, fn ($k) => DB::table('scoring_system_hooks')->where('system_key', $k)->where('is_enabled', 1)->exists()));",
    "jc active keys",
)

hooks_block = """private const ALL_HOOKS = ['juri', 'nilai', 'publikasi', 'rekap', 'sk'];

    /** Aksi controller yang dikunci oleh satu cantolan. Aksi di luar daftar ini tidak dibatasi. */
    private const ACTION_HOOK = [
        'storeJudge' => 'juri', 'updateJudge' => 'juri', 'destroyJudge' => 'juri', 'resetLink' => 'juri',
        'assignJudge' => 'juri', 'assignFromSibling' => 'juri', 'addToCategory' => 'juri',
        'inviteStore' => 'juri', 'inviteCancel' => 'juri',
        'saveCriteria' => 'nilai', 'toggle' => 'nilai',
        'publish' => 'publikasi', 'savePublication' => 'publikasi',
        'rekapExcel' => 'rekap', 'rekapLembar' => 'rekap', 'rekapLembarKosong' => 'rekap',
        'finalizeResult' => 'sk', 'saveResult' => 'sk', 'reopenResult' => 'sk', 'finalizeSkLomba' => 'sk',
        'finalizeOverall' => 'sk', 'saveOverallResult' => 'sk', 'reopenOverall' => 'sk',
    ];

    /** Cantolan (tab) yang aktif untuk satu sistem. Kalau daftarnya belum ada di database, semua dianggap aktif. */
    private function enabledHooks(?string $system): array
    {
        if (! $system) {
            return [];
        }
        if (! \\Illuminate\\Support\\Facades\\Schema::hasTable('scoring_system_hooks')) {
            return self::ALL_HOOKS;
        }
        $q = DB::table('scoring_system_hooks')->where('system_key', $system);
        if (! (clone $q)->exists()) {
            return self::ALL_HOOKS;
        }

        return $q->where('is_enabled', 1)->pluck('hook_key')->all();
    }

    """
anchor = "/** Sistem penilaian terpilih untuk satu event. Event lama yang sudah punya data dianggap 'weighted'. */"
jc = once(jc, anchor, hooks_block + anchor, "jc hooks block")
jc = once(
    jc,
    "'systemsActive' => $this->activeSystemKeys(),",
    "'systemsActive' => $this->activeSystemKeys(),\n            'systemHooks' => $this->enabledHooks($this->systemOf($event)),",
    "jc props",
)
jc = once(
    jc,
    "abort_unless($inst && $event->institution_id === $inst->id, 404);",
    "abort_unless($inst && $event->institution_id === $inst->id, 404);\n"
    "        $hook = self::ACTION_HOOK[$request->route()?->getActionMethod() ?? ''] ?? null;\n"
    "        if ($hook) {\n"
    "            $sys = $this->systemOf($event);\n"
    "            abort_if($sys !== null && ! in_array($hook, $this->enabledHooks($sys), true), 403, 'Fitur ini dimatikan untuk sistem penilaian ini.');\n"
    "        }",
    "jc guard",
)

# ---------------- penilaian.tsx ----------------
tsx = once(tsx, "systemLock?: string | null;", "systemLock?: string | null;\n    systemHooks?: string[] | null;", "tsx props type")
wrapper = """function PenilaianInner(props: any) {
    const systemHooks = ((usePageSys().props as any).systemHooks ?? null) as string[] | null;
    return <PenilaianInnerBase {...props} systemHooks={systemHooks} />;
}

"""
tsx = once(tsx, "function PenilaianInner({ event, isParent,", wrapper + "function PenilaianInnerBase({ systemHooks = null, event, isParent,", "tsx wrapper")
tsx = once(
    tsx,
    "const tabs = allTabs.filter((x) => x.k === 'sistem' || hasSystem);",
    "const tabs = allTabs.filter((x) => x.k === 'sistem' || (hasSystem && (systemHooks === null || systemHooks.includes(x.k))));\n"
    "    if (tabs.length > 0 && !tabs.some((x) => x.k === tab)) setTimeout(() => setTab(tabs[0].k), 0);",
    "tsx tabs",
)

# ---------------- file baru / timpa ----------------
mig = r"""<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scoring_system_hooks', function (Blueprint $t) {
            $t->id();
            $t->string('system_key', 30);
            $t->string('hook_key', 30);
            $t->string('label', 80);
            $t->string('description', 200)->nullable();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->boolean('is_enabled')->default(true);
            $t->timestamps();
            $t->unique(['system_key', 'hook_key']);
        });

        $rows = [
            ['juri', 'Juri', 'Kelola juri, undangan, dan link penilaian juri.'],
            ['nilai', 'Pengaturan penilaian', 'Skala, kriteria, bobot, pengurangan nilai, dan pengesahan kategori.'],
            ['publikasi', 'Publikasi', 'Publikasi hasil dan klasemen ke peserta.'],
            ['rekap', 'Rekap nilai', 'Rekap nilai, unduhan Excel, dan lembar penilaian.'],
            ['sk', 'Penetapan & SK', 'Penetapan hasil dan surat keputusan.'],
        ];
        foreach ($rows as $i => [$key, $label, $desc]) {
            DB::table('scoring_system_hooks')->insert([
                'system_key' => 'weighted', 'hook_key' => $key, 'label' => $label, 'description' => $desc,
                'sort' => $i + 1, 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('scoring_system_hooks');
    }
};
"""

ctrl = r"""<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ScoringSystemController extends Controller
{
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
                'used' => DB::table('judging_systems')->where('category_id', 0)->where('system', $r->system_key)->count(),
                'hooks' => ($hooks[$r->system_key] ?? collect())->map(fn ($h) => [
                    'key' => $h->hook_key,
                    'label' => $h->label,
                    'description' => (string) $h->description,
                    'enabled' => (bool) $h->is_enabled,
                ])->values(),
            ];
        })->values();

        return Inertia::render('admin/sistem-penilaian', ['systems' => $systems]);
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
"""

page = r"""import AdminLayout from '@/components/admin/admin-layout';
import { router } from '@inertiajs/react';
import { CheckSquare } from 'lucide-react';
import { useState } from 'react';

type Hook = { key: string; label: string; description: string; enabled: boolean };
type Sys = { key: string; name: string; description: string; tag: string; version: number; used: number; hooks: Hook[] };

const box = 'rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';

function SystemCard({ s }: { s: Sys }) {
    const [busy, setBusy] = useState('');
    const on = s.hooks.filter((h) => h.enabled).length;
    const total = s.hooks.length;
    const state = total === 0 ? 'none' : on === total ? 'full' : on === 0 ? 'dead' : 'partial';

    const toggle = (h: Hook) => {
        if (h.enabled) {
            const msg = `Matikan cantolan "${h.label}"?\n\nTab ini hilang di menu Penilaian dan aksinya ditolak server untuk semua event yang memakai ${s.name}${s.used > 0 ? ` (${s.used} event saat ini)` : ''}.`;
            if (!confirm(msg)) return;
        }
        router.patch(`/admin/penilaian/${s.key}/cantolan/${h.key}`, {}, {
            preserveScroll: true,
            onStart: () => setBusy(h.key),
            onFinish: () => setBusy(''),
        });
    };

    return (
        <div className={`${box} p-6`}>
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"><CheckSquare className="size-6" /></div>
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{s.tag || 'Sistem penilaian'} · Versi {s.version}</div>
                    <h3 className="text-xl font-extrabold leading-snug">{s.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center dark:border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Dipakai event</div>
                    <div className="text-xl font-extrabold">{s.used}</div>
                </div>
            </div>

            <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
                state === 'full' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                : state === 'partial' ? 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'}`}>
                {state === 'full' && 'Semua cantolan aktif. Sistem berjalan penuh.'}
                {state === 'partial' && `${total - on} dari ${total} cantolan dimatikan. Sistem berjalan terbatas.`}
                {state === 'dead' && 'Semua cantolan mati. Sistem lumpuh dan pilihannya tidak muncul untuk panitia.'}
                {state === 'none' && 'Sistem ini belum punya daftar cantolan.'}
            </div>

            <div className="mt-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">Cantolan (tab di menu Penilaian)</div>
            <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                {s.hooks.map((h) => (
                    <li key={h.key}>
                        <label className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5 ${busy === h.key ? 'opacity-60' : ''}`}>
                            <input type="checkbox" checked={h.enabled} disabled={busy !== ''} onChange={() => toggle(h)} className="size-5 shrink-0 accent-indigo-600" />
                            <span className="min-w-0 flex-1">
                                <span className={`block text-sm font-extrabold ${h.enabled ? '' : 'text-slate-400 line-through'}`}>{h.label}</span>
                                <span className="block text-xs text-slate-500">{h.description}</span>
                            </span>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${h.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{h.enabled ? 'Aktif' : 'Mati'}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function SistemPenilaian({ systems }: { systems: Sys[] }) {
    return (
        <AdminLayout title="Sistem Penilaian">
            <div className="space-y-5">
                <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 p-7 text-white shadow-lg">
                    <h2 className="text-3xl font-extrabold">Sistem Penilaian</h2>
                    <p className="mt-2 text-sm text-white/90">Tiap sistem punya cantolan berupa tab di menu Penilaian panitia. Cantolan yang dimatikan membuat bagian itu lumpuh: tab-nya hilang dan aksinya ditolak.</p>
                </div>
                {systems.map((s) => <SystemCard key={s.key} s={s} />)}
                {systems.length === 0 && <p className={`${box} p-8 text-center text-sm font-semibold text-slate-500`}>Belum ada sistem penilaian. Jalankan php artisan migrate.</p>}
            </div>
        </AdminLayout>
    );
}
"""

for path, content in ((WEB, web), (JC, jc), (TSX, tsx), (MIG, mig), (CTRL, ctrl), (PAGE, page)):
    open(path, "w", encoding="utf-8").write(content)
print("ok: sistem penilaian model ceklis (cantolan per tab) + penolakan di server")
