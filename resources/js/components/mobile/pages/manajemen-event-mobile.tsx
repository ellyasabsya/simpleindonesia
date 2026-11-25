import { router } from '@inertiajs/react';
import { CalendarDays, Inbox, Layers, MapPin, Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

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

export default function ManajemenEventMobile({ events, filters, counts, categories }: Props) {
    const [search, setSearch] = useState(filters.search);
    const first = useRef(true);

    const go = (p: { type?: string; search?: string }) =>
        router.get('/admin/events', { type: p.type ?? filters.type, search: p.search ?? search }, { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => go({ search }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const remove = (e: Ev) => {
        if (!window.confirm(`Hapus event "${e.title}"${e.sub_count > 0 ? ` beserta ${e.sub_count} kegiatannya` : ''}? Tindakan ini tidak bisa dibatalkan.`)) return;
        router.delete(`/admin/events/${e.id}`, { preserveScroll: true });
    };

    const tiles = [{ label: 'Total Event', n: counts.total ?? 0 }, ...Object.entries(categories).map(([k, l]) => ({ label: l, n: counts[k] ?? 0 }))];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Manajemen Event</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Lihat dan ubah event yang sudah tayang. Event baru dibuat lembaga, lalu diperiksa di Review Event.
                </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
                {tiles.map((t, i) => (
                    <div key={t.label} className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD + (i === 0 ? ' col-span-2' : '')}>
                        <p className={'text-xs leading-snug font-medium ' + MUTED}>{t.label}</p>
                        <p className="text-lg leading-none font-semibold text-indigo-600 tabular-nums dark:text-indigo-300">{t.n}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari judul atau lokasi..."
                        className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                    />
                </div>
                <select
                    value={filters.type}
                    onChange={(e) => go({ type: e.target.value })}
                    className="h-10 max-w-[8.5rem] rounded-full border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                >
                    <option value="semua">Semua Tipe</option>
                    {Object.entries(categories).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                    ))}
                    <option value="rangkaian">Rangkaian</option>
                </select>
            </div>

            <p className={'px-1 text-xs font-semibold ' + MUTED}>{events.total} event ditampilkan</p>

            {events.data.length === 0 ? (
                <div className={'flex flex-col items-center rounded-2xl px-4 py-8 text-center ' + CARD}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Tidak ada event tayang</p>
                    <p className={'mt-1 text-xs ' + MUTED}>Belum ada data untuk filter atau pencarian ini.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {events.data.map((e) => (
                        <div key={e.id} className={'space-y-1.5 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-[15px] leading-snug font-semibold break-words">{e.title}</div>
                                    <div className={'text-xs ' + MUTED}>
                                        ID #{e.id}
                                        {e.institution ? ` · ${e.institution}` : ''}
                                    </div>
                                </div>
                                {e.sub_count > 0 ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                                        <Layers className="h-3 w-3" /> Rangkaian · {e.sub_count}
                                    </span>
                                ) : (
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{e.category_label}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                {fmt(e.starts_at)} – {fmt(e.ends_at)}
                            </div>
                            {e.location && (
                                <div className="flex items-start gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span className="min-w-0 break-words">{e.location}</span>
                                </div>
                            )}
                            <div className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">{e.package} · {e.price_label}</div>
<div className="grid grid-cols-2 gap-2 pt-1">
                                <button type="button" onClick={() => router.get(`/admin/events/${e.id}/edit`)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                                    <Pencil className="h-4 w-4" /> Edit
                                </button>
                                <button type="button" onClick={() => remove(e)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                    <Trash2 className="h-4 w-4" /> Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination current={events.current_page} last={events.last_page} total={events.total} unit="event" />
        </div>
    );
}
