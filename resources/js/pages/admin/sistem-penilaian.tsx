import AdminLayout from '@/components/admin/admin-layout';
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
