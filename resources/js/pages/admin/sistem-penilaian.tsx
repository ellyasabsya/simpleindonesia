import AdminLayout from '@/components/admin/admin-layout';
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
