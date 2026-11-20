import { CalendarDays, Search } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import { Row, Section } from '../kit/section';
import { usePlatform } from '../use-platform';

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

const fmt = (s: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${s}T00:00:00`));

function dateRange(start: string | null, end: string | null): string | null {
    if (!start && !end) return null;
    if (!start || !end || start === end) return fmt((start ?? end)!);
    return `${fmt(start)} – ${fmt(end)}`;
}

function initials(title: string): string {
    return title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');
}

function Poster({ e }: { e: EventCard }) {
    return e.poster ? (
        <img src={e.poster} alt="" loading="lazy" className="h-[60px] w-12 shrink-0 rounded-lg object-cover" />
    ) : (
        <span className="flex h-[60px] w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
            {initials(e.title)}
        </span>
    );
}

const STATUS_COLOR = { berlangsung: 'text-[#34C759]', segera: 'text-[#007AFF] dark:text-[#0A84FF]', selesai: 'text-black/40 dark:text-white/40' } as const;

/** Daftar event untuk HP: judul besar, kolom cari, chip kategori, lalu baris event dengan poster kecil. */
export default function EventsMobile({ events, categories, total, filters, q, setQ, onVisit }: Props) {
    const ios = usePlatform() === 'ios';
    const muted = ios ? 'text-black/50 dark:text-white/50' : 'text-[#49454f] dark:text-[#cac4d0]';

    const chip = (active: boolean) =>
        `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition active:opacity-60 ${
            ios
                ? `h-8 rounded-full px-4 text-[15px] ${active ? 'bg-[#007AFF] text-white dark:bg-[#0A84FF]' : 'bg-black/[0.06] text-black dark:bg-white/10 dark:text-white'}`
                : `h-8 rounded-lg px-3 text-sm font-medium ${active ? 'bg-[#e8def8] text-[#1d192b] dark:bg-[#4a4458] dark:text-[#e8def8]' : 'border border-[#79747e] text-[#1d1b20] dark:border-[#938f99] dark:text-[#e6e0e9]'}`
        }`;

    return (
        <div className="space-y-5">
            <div>
                <h1 className={ios ? 'text-[34px] leading-tight font-bold' : 'text-[28px] leading-tight'}>Semua Event</h1>
                <p className={`mt-1 text-sm ${muted}`}>{total} event tersedia di SIMPLE.</p>
            </div>

            <div className="relative">
                <Search className={`pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 ${muted}`} />
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari event atau lokasi"
                    className={`w-full pr-3 pl-9 text-[17px] outline-none ${
                        ios ? 'h-10 rounded-[10px] bg-black/[0.06] dark:bg-white/10' : 'h-12 rounded-full bg-[#ece6f0] dark:bg-[#2b2930]'
                    }`}
                />
            </div>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                <button type="button" onClick={() => onVisit({ q })} className={chip(!filters.kategori)}>
                    Semua
                </button>
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
                    <p className={`px-1 text-xs ${muted}`}>
                        Menampilkan {events.from}–{events.to} dari {events.total} event
                    </p>
                    <Section>
                        {events.data.map((e) => {
                            const range = dateRange(e.starts_at, e.ends_at);
                            const line1 = e.is_series ? ['Rangkaian', e.sub_count ? `${e.sub_count} acara` : null, range].filter(Boolean).join(' · ') : range;
                            return (
                                <Row
                                    key={e.id}
                                    leading={<Poster e={e} />}
                                    label={e.title}
                                    sub={
                                        <>
                                            {line1 && <span className="block truncate">{line1}</span>}
                                            {e.location && <span className="block truncate">{e.location}</span>}
                                        </>
                                    }
                                    value={<span className={`text-xs font-semibold ${STATUS_COLOR[e.status.key]}`}>{e.status.label}</span>}
                                    href={e.href ?? `/events/${e.slug ?? e.id}`}
                                />
                            );
                        })}
                    </Section>

                    {events.last_page > 1 && (
                        <div className="flex items-center justify-between gap-2">
                            {events.current_page > 1 ? (
                                <Button variant="tonal" onClick={() => onVisit({ q, kategori: filters.kategori, page: events.current_page - 1 })}>
                                    Sebelumnya
                                </Button>
                            ) : (
                                <span />
                            )}
                            <span className={`text-xs ${muted}`}>
                                {events.current_page} / {events.last_page}
                            </span>
                            {events.current_page < events.last_page ? (
                                <Button variant="tonal" onClick={() => onVisit({ q, kategori: filters.kategori, page: events.current_page + 1 })}>
                                    Berikutnya
                                </Button>
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
