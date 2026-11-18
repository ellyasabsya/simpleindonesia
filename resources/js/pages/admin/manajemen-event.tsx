import { router } from '@inertiajs/react';
import { CalendarDays, Inbox, Layers, MapPin, Pencil, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

type Ev = {
    id: number; title: string; category: string | null; category_label: string; location: string | null;
    starts_at: string; ends_at: string; sub_count: number; institution: string | null;
};
type Props = {
    events: { data: Ev[]; current_page: number; last_page: number; total: number; prev_page_url: string | null; next_page_url: string | null };
    filters: { search: string; type: string };
    counts: Record<string, number>;
    categories: Record<string, string>;
};

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500';
const td = 'px-4 py-3.5 align-middle';
const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

export default function ManajemenEvent({ events, filters, counts, categories }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState<Ev | null>(null);
    const [form, setForm] = useState({ title: '', category: '', location: '', starts_at: '', ends_at: '' });
    const [errs, setErrs] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const first = useRef(true);

    const go = (p: { type?: string; search?: string }) =>
        router.get('/admin/events', { type: p.type ?? filters.type, search: p.search ?? search }, { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => go({ search }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openEdit = (e: Ev) => {
        setEditing(e);
        setErrs({});
        setForm({ title: e.title, category: e.category ?? '', location: e.location ?? '', starts_at: e.starts_at, ends_at: e.ends_at });
    };

    const save = () => {
        if (!editing) return;
        router.patch(`/admin/events/${editing.id}`, form, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onError: (er) => setErrs(er as Record<string, string>),
            onSuccess: () => setEditing(null),
            onFinish: () => setSaving(false),
        });
    };

    const remove = (e: Ev) => {
        if (!window.confirm(`Hapus event "${e.title}"${e.sub_count > 0 ? ` beserta ${e.sub_count} kegiatannya` : ''}? Tindakan ini tidak bisa dibatalkan.`)) return;
        router.delete(`/admin/events/${e.id}`, {
            preserveScroll: true,
        });
    };

    const palette = ['text-sky-600', 'text-pink-600', 'text-emerald-600', 'text-amber-600', 'text-violet-600', 'text-rose-600'];
    const cards = [
        { label: 'Total Event', n: counts.total ?? 0, color: 'text-indigo-600', sub: 'Event tayang' },
        ...Object.entries(categories).map(([k, l], i) => ({
            label: l, n: counts[k] ?? 0, color: palette[i % palette.length], sub: 'Event & kegiatan',
        })),
    ];

    return (
        <AdminLayout title="Manajemen Event">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Event Management
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold">Manajemen Event</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/80">
                            Lihat dan ubah event yang sudah tayang. Event baru dibuat oleh lembaga lewat menu Lembaga, lalu diperiksa di Review Event.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
                            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${c.color}`}>{c.n}</div>
                            <div className="mt-1 text-xs text-slate-500">{c.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        <div>
                            <h3 className="text-base font-extrabold">Daftar Event</h3>
                            <p className="text-sm text-slate-500">{events.total} event ditampilkan</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul atau lokasi..." className={`${inp} w-64 pl-9`} />
                            </div>
                            <select className={`${inp} w-auto`} value={filters.type} onChange={(e) => go({ type: e.target.value })}>
                                <option value="semua">Semua Tipe</option>
                                {Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                <option value="rangkaian">Rangkaian</option>
                            </select>
                        </div>
                    </div>

                    {events.data.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10"><Inbox className="h-7 w-7" /></div>
                            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">Tidak ada event tayang</p>
                            <p className="mt-1 text-sm text-slate-500">Belum ada data untuk filter atau pencarian ini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        {['Event', 'Tipe', 'Tanggal', 'Lokasi', 'Aksi'].map((h) => (
                                            <th key={h} className={`${th} ${h === 'Aksi' ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {events.data.map((e) => (
                                        <tr key={e.id}>
                                            <td className={td}>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{e.title}</p>
                                                <p className="text-xs text-slate-500">ID Event #{e.id}{e.institution ? ` · ${e.institution}` : ''}</p>
                                            </td>
                                            <td className={td}>
                                                {e.sub_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                                                        <Layers className="h-3 w-3" /> Rangkaian · {e.sub_count}
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">{e.category_label}</span>
                                                )}
                                            </td>
                                            <td className={`${td} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                                                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{fmt(e.starts_at)} – {fmt(e.ends_at)}</span>
                                            </td>
                                            <td className={`${td} text-slate-600 dark:text-slate-300`}>
                                                {e.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.location}</span> : '-'}
                                            </td>
                                            <td className={td}>
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => router.get(`/admin/events/${e.id}/edit`)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-white">
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => remove(e)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300">
                                                        <Trash2 className="h-4 w-4" /> Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination current={events.current_page} last={events.last_page} total={events.total} unit="event" />
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
                    <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-extrabold">Edit event</h3>
                                <p className="text-sm text-slate-500">Poster, tiket, dan paket tidak bisa diubah dari sini.</p>
                            </div>
                            <button type="button" onClick={() => setEditing(null)} aria-label="Tutup" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-4 space-y-3">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Judul
                                <input className={`${inp} mt-1`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                {errs.title && <span className="mt-1 block text-xs text-rose-500">{errs.title}</span>}
                            </label>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Kategori
                                <select className={`${inp} mt-1`} value={form.category} disabled={editing.sub_count > 0} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option value="">{editing.sub_count > 0 ? 'Rangkaian (tidak punya kategori)' : '-'}</option>
                                    {Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                </select>
                                {errs.category && <span className="mt-1 block text-xs text-rose-500">{errs.category}</span>}
                            </label>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Lokasi
                                <input className={`${inp} mt-1`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                                {errs.location && <span className="mt-1 block text-xs text-rose-500">{errs.location}</span>}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Mulai
                                    <input type="date" className={`${inp} mt-1`} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                                    {errs.starts_at && <span className="mt-1 block text-xs text-rose-500">{errs.starts_at}</span>}
                                </label>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Selesai
                                    <input type="date" className={`${inp} mt-1`} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                                    {errs.ends_at && <span className="mt-1 block text-xs text-rose-500">{errs.ends_at}</span>}
                                </label>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Batal</button>
                            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
