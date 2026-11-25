import { router } from '@inertiajs/react';
import { CalendarDays, Inbox, Layers, MapPin, Pencil, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

type Ev = {
    id: number; title: string; category: string | null; category_label: string; location: string | null;
    starts_at: string; ends_at: string; sub_count: number; institution: string | null; package: string; price_label: string;
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
const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none max-md:h-10 max-md:py-0 max-md:text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

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
            <div className="w-full space-y-3 pb-24 md:space-y-5 md:pb-0">
                <div className="relative overflow-hidden rounded-2xl bg-indigo-600 px-4 py-3 text-white shadow-sm md:rounded-3xl md:bg-gradient-to-br md:from-indigo-700 md:via-blue-600 md:to-violet-600 md:px-7 md:py-6 md:shadow-lg md:shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 max-md:hidden" />
                    <div className="relative max-md:min-w-0 max-md:flex-1">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] max-md:hidden">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Event Management
                        </span>
                        <h2 className="text-base font-semibold md:mt-3 md:text-2xl md:font-extrabold">Manajemen Event</h2>
                        <p className="mt-0.5 max-w-2xl line-clamp-2 text-xs leading-snug text-white/80 md:mt-1 md:line-clamp-none md:text-sm">
                            Lihat dan ubah event yang sudah tayang. Event baru dibuat oleh lembaga lewat menu Lembaga, lalu diperiksa di Review Event.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 xl:grid-cols-6">
                    {cards.map((c) => (
                        <div key={c.label} className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-none max-md:[&:first-child]:col-span-2 md:block md:bg-white/80 md:p-5 md:shadow-sm dark:border-white/10 dark:bg-white/5">
                            <div className="min-w-0 text-xs font-medium leading-snug text-slate-600 md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-slate-500">{c.label}</div>
                            <div className={`text-lg leading-none font-semibold tabular-nums max-md:!text-indigo-600 md:mt-2 md:text-3xl md:font-extrabold ${c.color}`}>{c.n}</div>
                            <div className="mt-1 text-xs text-slate-500 max-md:hidden">{c.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-4 md:py-3 dark:border-white/10">
                        <div>
                            <h3 className="text-[15px] font-semibold md:text-base md:font-extrabold">Daftar Event</h3>
                            <p className="text-xs text-slate-500 md:text-sm">{events.total} event ditampilkan</p>
                        </div>
                        <div className="flex items-center gap-2 max-md:w-full md:flex-wrap">
                            <div className="relative max-md:min-w-0 max-md:flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul atau lokasi..." className={`${inp} w-full pl-9 max-md:rounded-full md:w-64`} />
                            </div>
                            <select className={`${inp} w-auto max-md:max-w-[8.5rem] max-md:rounded-full`} value={filters.type} onChange={(e) => go({ type: e.target.value })}>
                                <option value="semua">Semua Tipe</option>
                                {Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                <option value="rangkaian">Rangkaian</option>
                            </select>
                        </div>
                    </div>

                    {events.data.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-8 text-center md:py-16">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10"><Inbox className="h-7 w-7" /></div>
                            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">Tidak ada event tayang</p>
                            <p className="mt-1 text-sm text-slate-500">Belum ada data untuk filter atau pencarian ini.</p>
                        </div>
                    ) : (
                        <div className="md:overflow-x-auto">
<div className="md:hidden">
                            <div className="divide-y divide-slate-100 dark:divide-white/10">
                                {events.data.map((e) => (
                                    <div key={`m${e.id}`} className="space-y-1.5 px-3 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-[15px] leading-snug font-semibold break-words">{e.title}</div>
                                                <div className="text-xs text-slate-500">ID #{e.id}{e.institution ? ` · ${e.institution}` : ''}</div>
                                            </div>
                                            {e.sub_count > 0 ? (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"><Layers className="h-3 w-3" /> Rangkaian · {e.sub_count}</span>
                                            ) : (
                                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{e.category_label}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{fmt(e.starts_at)} – {fmt(e.ends_at)}</div>
                                        {e.location && <div className="flex items-start gap-1.5 text-[13px] text-slate-600 dark:text-slate-300"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{e.location}</span></div>}
                                        <div className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">{e.package} · {e.price_label}</div>
<div className="grid grid-cols-2 gap-2 pt-1">
                                            <button type="button" onClick={() => router.get(`/admin/events/${e.id}/edit`)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-white"><Pencil className="h-4 w-4" /> Edit</button>
                                            <button type="button" onClick={() => remove(e)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"><Trash2 className="h-4 w-4" /> Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                            <table className="hidden w-full min-w-[1000px] text-sm md:table">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        {['Event', 'Tipe', 'Paket & Harga', 'Tanggal', 'Lokasi', 'Aksi'].map((h) => (
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
                                            <td className={td}>
<p className="font-semibold text-slate-800 dark:text-slate-100">{e.package}</p>
<p className="text-xs text-slate-500">{e.price_label}</p>
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
                    <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6 dark:border-white/10 dark:bg-slate-900">
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
                            <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 max-md:h-10 max-md:py-0 dark:text-slate-300 dark:hover:bg-white/10">Batal</button>
                            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50 max-md:h-10 max-md:rounded-full max-md:py-0">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
