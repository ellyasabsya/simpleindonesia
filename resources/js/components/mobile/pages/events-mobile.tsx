import { CalendarDays, Search } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import PosterCard from '../kit/poster-card';

type Paginated = {
    data: EventCard[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};
type Category = { key: string; label: string; count: number };
type Query = { q?: string; kategori?: string; page?: number };

type Props = {
    events: Paginated;
    categories: Category[];
    total: number;
    filters: { q: string; kategori: string };
    q: string;
    setQ: (v: string) => void;
    onVisit: (p: Query) => void;
};

const chip = (active: boolean) =>
    'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition active:scale-95 ' +
    (active
        ? 'bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-900/25'
        : 'bg-white text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200');

/** Daftar event HP: kolom cari, chip kategori, lalu grid poster 2 kolom. Dibungkus PublicScreen oleh halamannya. */
export default function EventsMobile({ events, categories, total, filters, q, setQ, onVisit }: Props) {
    return (
        <div className="space-y-5">
            <p className="px-1 text-sm text-slate-500 dark:text-slate-400">{total} event tersedia di SIMPLE</p>

            <label className="flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.3)] dark:bg-white/10">
                <Search className="size-5 shrink-0 text-slate-400" />
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari event atau lokasi"
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                />
            </label>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                <button type="button" onClick={() => onVisit({ q })} className={chip(!filters.kategori)}>Semua</button>
                {categories.map((c) => (
                    <button key={c.key} type="button" onClick={() => onVisit({ q, kategori: c.key })} className={chip(filters.kategori === c.key)}>
                        {c.label}
                        <span className="opacity-60">{c.count}</span>
                    </button>
                ))}
            </div>

            {events.data.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Tidak ada event" text="Tidak ada event yang cocok dengan pencarian atau kategori ini." />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        {events.data.map((e) => (
                            <PosterCard key={e.id} compact event={e} href={e.href ?? '/events/' + (e.slug ?? e.id)} className="w-full" />
                        ))}
                    </div>

                    {events.last_page > 1 && (
                        <div className="flex items-center justify-between gap-2">
                            {events.current_page > 1 ? (
                                <Button variant="tonal" onClick={() => onVisit({ q, kategori: filters.kategori, page: events.current_page - 1 })}>Sebelumnya</Button>
                            ) : (
                                <span />
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400">{events.current_page} / {events.last_page}</span>
                            {events.current_page < events.last_page ? (
                                <Button variant="tonal" onClick={() => onVisit({ q, kategori: filters.kategori, page: events.current_page + 1 })}>Berikutnya</Button>
                            ) : (
                                <span />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
