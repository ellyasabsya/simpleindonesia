import AdminLayout from '@/components/admin/admin-layout';
import { router } from '@inertiajs/react';
import { CheckSquare, Lock, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Hook = { key: string; label: string; description: string; enabled: boolean };
type Sys = { key: string; name: string; description: string; tag: string; version: number; active: boolean; used: number; hooks: Hook[] };
type Cat = { key: string; label: string; description: string };

const box = 'rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white';
const lbl = 'block text-xs font-extrabold uppercase tracking-wider text-slate-500';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[0-9]+/, '').slice(0, 30);

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

function HookList({ hooks, busy, onToggle }: { hooks: { key: string; label: string; description: string; enabled: boolean }[]; busy?: string; onToggle: (k: string) => void }) {
    return (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {hooks.map((h) => (
                <li key={h.key}>
                    <label className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5 ${busy === h.key ? 'opacity-60' : ''}`}>
                        <input type="checkbox" checked={h.enabled} disabled={!!busy} onChange={() => onToggle(h.key)} className="size-5 shrink-0 accent-indigo-600" />
                        <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-extrabold ${h.enabled ? '' : 'text-slate-400 line-through'}`}>{h.label}</span>
                            <span className="block text-xs text-slate-500">{h.description}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${h.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{h.enabled ? 'Aktif' : 'Mati'}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}

function EditModal({ s, onClose }: { s: Sys; onClose: () => void }) {
    const [name, setName] = useState(s.name);
    const [tag, setTag] = useState(s.tag);
    const [desc, setDesc] = useState(s.description);
    const [busy, setBusy] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const on = s.hooks.filter((h) => h.enabled).length;

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
                    <button type="button" disabled={saving || name.trim() === ''} onClick={save} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50">Simpan perubahan</button>
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200">Tutup</button>
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cantolan (tab di menu Penilaian)</div>
                    <div className={`mt-2 rounded-2xl px-4 py-2.5 text-sm font-bold ${on === s.hooks.length && on > 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : on === 0 ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200'}`}>
                        {s.hooks.length === 0 ? 'Sistem ini belum punya cantolan.' : on === s.hooks.length ? 'Semua cantolan aktif. Sistem berjalan penuh.' : on === 0 ? 'Semua cantolan mati. Sistem lumpuh dan pilihannya tidak muncul untuk panitia.' : `${s.hooks.length - on} dari ${s.hooks.length} cantolan dimatikan. Sistem berjalan terbatas.`}
                    </div>
                    <div className="mt-3"><HookList hooks={s.hooks} busy={busy} onToggle={toggleHook} /></div>
                </div>
            </div>
        </Modal>
    );
}

function AddModal({ catalog, onClose }: { catalog: Cat[]; onClose: () => void }) {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [keyTouched, setKeyTouched] = useState(false);
    const [tag, setTag] = useState('');
    const [desc, setDesc] = useState('');
    const [picked, setPicked] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const submit = () => {
        setErr('');
        router.post('/admin/penilaian', { name, system_key: key, tag, description: desc, hooks: picked } as any, {
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
                        <input value={key} onChange={(e) => { setKeyTouched(true); setKey(e.target.value.toLowerCase()); }} maxLength={30} placeholder="mis. match" className={input} />
                    </label>
                    <label className={lbl}>Label
                        <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} placeholder="mis. Olahraga" className={input} />
                    </label>
                </div>
                <label className={lbl}>Deskripsi<textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className={input} /></label>
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cantolan yang dipakai sistem ini</div>
                    <p className="mb-2 mt-1 text-xs text-slate-500">Tiap cantolan adalah satu tab di menu Penilaian. Yang tidak dicentang tetap terdaftar, tapi mati.</p>
                    <HookList
                        hooks={catalog.map((c) => ({ ...c, enabled: picked.includes(c.key) }))}
                        onToggle={(k) => setPicked((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]))}
                    />
                </div>
                <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">Sistem baru dibuat dalam keadaan nonaktif. Aktifkan lewat tombol Aktifkan di kartunya setelah siap.</p>
                {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
                <div className="flex gap-2">
                    <button type="button" disabled={busy || name.trim() === '' || key.trim() === ''} onClick={submit} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50">Tambah sistem</button>
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200">Batal</button>
                </div>
            </div>
        </Modal>
    );
}

function SystemCard({ s, onEdit }: { s: Sys; onEdit: () => void }) {
    const [busy, setBusy] = useState(false);
    const on = s.hooks.filter((h) => h.enabled).length;

    const toggle = () => {
        const msg = s.active
            ? `Nonaktifkan "${s.name}"?\n\nPanitia tidak akan melihat pilihan ini di menu Penilaian.${s.used > 0 ? ` ${s.used} event yang sudah memakainya tetap berjalan.` : ''}`
            : `Aktifkan "${s.name}"? Panitia bisa memilihnya di menu Penilaian.`;
        if (!confirm(msg)) return;
        router.patch(`/admin/penilaian/${s.key}/aktif`, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    return (
        <div className={`${box} flex flex-col gap-4 p-6 ${s.active ? '' : 'opacity-85'}`}>
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

            <div className="flex flex-wrap gap-2">
                {s.used > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-400/15 dark:text-amber-200"><Lock className="size-3.5" /> Terkunci</span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${s.hooks.length > 0 && on === s.hooks.length ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200' : on === 0 ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200'}`}>
                    {on}/{s.hooks.length} cantolan aktif
                </span>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
                <button type="button" onClick={onEdit} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-indigo-700">Detail / Edit</button>
                <button type="button" disabled={busy} onClick={toggle} className={`px-2 text-sm font-extrabold disabled:opacity-50 ${s.active ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                    {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
            </div>
        </div>
    );
}

export default function SistemPenilaian({ systems, catalog }: { systems: Sys[]; catalog: Cat[] }) {
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

            {editing && <EditModal key={editing.key} s={editing} onClose={() => setEditKey(null)} />}
            {adding && <AddModal catalog={catalog} onClose={() => setAdding(false)} />}
        </AdminLayout>
    );
}
