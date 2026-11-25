import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import { Empty } from '../home/panels';
import EventsGrid from './events-grid';
import { CARD, LUX_CSS, MUTED, PRESS } from '../kit/soft';

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

const navBtn = 'flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-slate-900 disabled:opacity-40 dark:text-white ' + CARD + ' ' + PRESS;

/** Daftar event HP: cari, chip kategori, daftar baris, paginasi. Dibungkus PublicScreen oleh halamannya. */
export default function EventsMobile({ events, categories, total, filters, q, onVisit }: Props) {
    const kategori = filters.kategori;
    const go = (page: number): void => {
        onVisit({ q, kategori, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-4">
            <style>{LUX_CSS}</style>

            {events.data.length === 0 ? (
                <Empty icon={<CalendarDays className="size-6" strokeWidth={1.5} />} text="Tidak ada event yang cocok dengan pencarian atau kategori ini." />
            ) : (
                <>
                    <p className={'px-1 text-xs ' + MUTED}>
                        {events.from && events.to ? 'Menampilkan ' + events.from + '–' + events.to + ' dari ' + events.total + ' event' : events.total + ' event'}
                    </p>

                    <div key={events.current_page + '|' + kategori + '|' + q}>
                        <EventsGrid list={events.data} />
                    </div>

                    {events.last_page > 1 && (
                        <nav aria-label="Paginasi" className="flex items-center justify-between gap-3 pt-2">
                            <button type="button" disabled={events.current_page <= 1} onClick={() => go(events.current_page - 1)} className={navBtn}>
                                <ChevronLeft className="size-4" />
                                Sebelumnya
                            </button>
                            <span className={'text-xs ' + MUTED}>
                                {events.current_page} / {events.last_page}
                            </span>
                            <button type="button" disabled={events.current_page >= events.last_page} onClick={() => go(events.current_page + 1)} className={navBtn}>
                                Berikutnya
                                <ChevronRight className="size-4" />
                            </button>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}
