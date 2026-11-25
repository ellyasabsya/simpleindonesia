import { Link } from '@inertiajs/react';
import { CalendarDays, Check, ChevronDown, Layers, MapPin, Newspaper, Ticket, Trophy } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { EventCard } from '@/components/landing/event-section';
import { themes, type PackageCard } from '@/components/landing/package-card';
import ListRow from '../kit/list-row';
import { eventRange } from '../kit/poster-card';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

export type NewsCard = {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    cover_url: string | null;
    date: string | null;
};

const DOT: Record<EventCard['status']['key'], string> = {
    berlangsung: 'bg-emerald-400',
    segera: 'bg-sky-400',
    selesai: 'bg-neutral-400',
};

export function Empty({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className={'flex flex-col items-center gap-2 rounded-3xl py-14 text-center text-sm ' + FIELD + ' ' + MUTED}>
            {icon}
            {text}
        </div>
    );
}

function More({ href, label, reload }: { href: string; label: string; reload?: boolean }) {
    const cls = 'mt-4 flex h-12 items-center justify-center rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 ' + CARD + ' ' + PRESS;
    return reload ? (
        <a href={href} className={cls}>{label}</a>
    ) : (
        <Link href={href} className={cls}>{label}</Link>
    );
}

const status = (e: EventCard) => (
    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        <span className={'size-1.5 rounded-full ' + DOT[e.status.key]} />
        {e.status.label}
    </span>
);

const kind = (e: EventCard) => (e.is_series ? (e.sub_count ? 'Rangkaian · ' + e.sub_count + ' acara' : 'Rangkaian') : e.category);

/** Daftar event berbaris: dipakai beranda, voting, dan halaman Event. withKind menambah baris kategori. */
export function EventRows({ list, base, withKind }: { list: EventCard[]; base: string; withKind?: boolean }) {
    return (
        <div className={GROUP}>
            {list.map((e) => (
                <ListRow
                    key={e.id}
                    href={e.href ?? base + (e.slug ?? e.id)}
                    image={e.poster}
                    tall
                    fallback={<CalendarDays className="size-6" strokeWidth={1.5} />}
                    eyebrow={status(e)}
                    title={e.title}
                    lines={[eventRange(e.starts_at, e.ends_at), e.location, withKind ? kind(e) : null]}
                />
            ))}
        </div>
    );
}

const PALETTES = [
    { bg: 'from-indigo-100 via-violet-50 to-sky-100 dark:from-indigo-950 dark:via-[#15173a] dark:to-slate-900', ink: 'text-indigo-700 dark:text-indigo-200' },
    { bg: 'from-sky-100 via-cyan-50 to-indigo-100 dark:from-sky-950 dark:via-[#10203a] dark:to-slate-900', ink: 'text-sky-700 dark:text-sky-200' },
    { bg: 'from-indigo-100 via-slate-50 to-violet-100 dark:from-indigo-950 dark:via-[#15173a] dark:to-slate-900', ink: 'text-violet-700 dark:text-violet-200' },
    { bg: 'from-emerald-100 via-teal-50 to-sky-100 dark:from-emerald-950 dark:via-[#0f2a2e] dark:to-slate-900', ink: 'text-emerald-700 dark:text-emerald-200' },
];

const initialsOf = (t: string) =>
    t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

const dateParts = (s: string | null) => {
    if (!s) return null;
    const d = new Date(s.length > 10 ? s : s + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    return { d: d.getDate(), m: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d) };
};

/** Gambar sampul 16:10. Poster tampil utuh di atas latar buram; tanpa poster: gradasi lembut + inisial. */
function Cover({ e, big, priority }: { e: EventCard; big?: boolean; priority?: boolean }) {
    const pal = PALETTES[e.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];

    return (
        <div className={'relative overflow-hidden bg-slate-200 dark:bg-neutral-800 ' + 'aspect-[4/5]'}>
            {e.poster ? (
                <>
                    <img src={e.poster} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
                    <img src={e.poster} alt={e.title} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" className="relative size-full object-contain" />
                </>
            ) : (
                <div className={'absolute inset-0 flex items-center justify-center bg-gradient-to-br ' + pal.bg}>
                    <span aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.2)_1px,transparent_1px)] bg-[length:14px_14px]" />
                    <span
                        className={
                            'relative flex items-center justify-center rounded-2xl bg-white/80 font-semibold tracking-tight ring-1 ring-slate-900/5 dark:bg-white/10 dark:ring-white/10 ' +
                            pal.ink +
                            (big ? ' size-20 text-3xl' : ' size-12 text-lg')
                        }
                    >
                        {initialsOf(e.title)}
                    </span>
                </div>
            )}

            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-white/20">
                <span className={'size-1.5 rounded-full ' + DOT[e.status.key]} />
                {e.status.label}
            </span>
            {big && e.is_series && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Layers className="size-3.5" />
                    {e.sub_count ? e.sub_count + ' acara' : 'Rangkaian'}
                </span>
            )}
        </div>
    );
}

/** Sorotan: kartu lanskap, blok tanggal di kiri, judul dan lokasi di kanan. */
function FeaturedCard({ e, priority }: { e: EventCard; priority?: boolean }) {
    const dp = dateParts(e.starts_at);
    const multi = !!e.ends_at && e.ends_at !== e.starts_at;
    const label = kind(e);

    return (
        <Link href={e.href ?? '/events/' + (e.slug ?? e.id)} className={'block overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
            <Cover e={e} big priority={priority} />
            <div className="flex items-start gap-3.5 p-4">
                {dp && (
                    <span className={'flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl leading-none ' + FIELD}>
                        <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{dp.d}</span>
                        <span className={'mt-1 text-[11px] font-medium ' + MUTED}>{dp.m}</span>
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[18px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-white">{e.title}</h3>
                    <div className={'mt-1.5 space-y-0.5 text-xs font-medium ' + MUTED}>
                        {multi && (
                            <p className="flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 shrink-0" />
                                {eventRange(e.starts_at, e.ends_at)}
                            </p>
                        )}
                        {e.location && (
                            <p className="flex min-w-0 items-center gap-1.5">
                                <MapPin className="size-3.5 shrink-0" />
                                <span className="truncate">{e.location}</span>
                            </p>
                        )}
                    </div>
                    {label && <p className="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">{label}</p>}
                </div>
            </div>
        </Link>
    );
}

/** Kartu rak: lebar sekitar 72% layar, kartu berikutnya mengintip dari kanan. */
function ShelfCard({ e }: { e: EventCard }) {
    const range = eventRange(e.starts_at, e.ends_at);

    return (
        <Link href={e.href ?? '/events/' + (e.slug ?? e.id)} className={'block w-[44%] shrink-0 snap-start overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
            <Cover e={e} />
            <div className="p-3">
                <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold text-slate-900 dark:text-white">{e.title}</h3>
                <p className={'mt-1 truncate text-[11px] ' + MUTED}>{range}</p>
                {e.location && <p className={'truncate text-[11px] ' + MUTED}>{e.location}</p>}
            </div>
        </Link>
    );
}

function Heading({ children }: { children: ReactNode }) {
    return <h2 className="mt-7 mb-3 px-1 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{children}</h2>;
}

const FEATURED_WEEKS = 12;
const toDate = (s: string | null) => (s ? new Date(s.slice(0, 10) + 'T00:00:00') : null);

/** Kartu besar berbentuk carousel: satu kartu per layar, bisa digeser, titik indikator di bawah. */
function FeaturedCarousel({ list }: { list: EventCard[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    const onScroll = () => {
        const el = ref.current;
        if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    if (list.length === 0) return null;
    if (list.length === 1) return <FeaturedCard e={list[0]} priority />;

    return (
        <div className="-mx-5">
            <div
                ref={ref}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {list.map((e, i) => (
                    <div key={e.id} className="w-full shrink-0 snap-center px-5">
                        <FeaturedCard e={e} priority={i === 0} />
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-1.5 pt-3">
                {list.map((e, i) => (
                    <span
                        key={e.id}
                        className={'h-1.5 rounded-full transition-all duration-300 ' + (i === index ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-400/40')}
                    />
                ))}
            </div>
        </div>
    );
}

/** Event: satu sorotan lanskap, rak geser "Segera dimulai", lalu daftar baris. */
export function EventPanel({ events }: { events: EventCard[] }) {
    const [hero, ...others] = events;
    if (!hero) return <Empty icon={<CalendarDays className="size-6" strokeWidth={1.5} />} text="Belum ada event" />;

    const soon = others.filter((e) => e.status.key === 'segera').slice(0, 4);
    const rest = others.filter((e) => !soon.includes(e)).slice(0, 3);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today.getTime() + FEATURED_WEEKS * 7 * 86400000);
    const upcoming = events
        .filter((e) => {
            const start = toDate(e.starts_at);
            if (!start) return false;
            const end = toDate(e.ends_at) ?? start;
            return end >= today && start <= limit;
        })
        .sort((a, b) => (toDate(a.starts_at)?.getTime() ?? 0) - (toDate(b.starts_at)?.getTime() ?? 0));
    const featured = upcoming.length > 0 ? upcoming : [hero];

    return (
        <div>
            <FeaturedCarousel list={featured} />

            {soon.length > 0 && (
                <>
                    <Heading>Segera dimulai</Heading>
                    <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                        {soon.map((e) => (
                            <ShelfCard key={e.id} e={e} />
                        ))}
                    </div>
                </>
            )}

            {rest.length > 0 && (
                <>
                    <Heading>Event lainnya</Heading>
                    <EventRows list={rest} base="/events/" />
                </>
            )}

            <More href="/events" label="Lihat semua event" />
        </div>
    );
}

export function VotingPanel({ votings }: { votings: EventCard[] }) {
    if (votings.length === 0) return <Empty icon={<Trophy className="size-6" strokeWidth={1.5} />} text="Belum ada voting yang dibuka" />;

    return (
        <div>
            <EventRows list={votings.slice(0, 4)} base="/voting/" />
            <More href="/voting" label="Lihat semua voting" reload />
        </div>
    );
}

type TicketRow = {
    id: number;
    href: string;
    title: string;
    poster: string | null;
    starts_at: string;
    ends_at: string;
    location: string;
    ticket_name: string;
    price: number;
    valid_until: string;
    available: boolean;
    category: string | null;
};

const rupiah = (n: number) => (n > 0 ? 'Rp ' + new Intl.NumberFormat('id-ID').format(n) : 'Gratis');

// Cache modul: pindah segmen tidak memuat ulang.
let ticketCache: TicketRow[] | null = null;

/** E-Ticketing: data sama dengan web (/tiket-data), dimuat saat segmen dibuka. */
export function TicketPanel() {
    const [rows, setRows] = useState<TicketRow[] | null>(ticketCache);

    useEffect(() => {
        if (ticketCache) return;
        let off = false;
        fetch('/tiket-data', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((d) => {
                ticketCache = Array.isArray(d) ? d : [];
                if (!off) setRows(ticketCache);
            })
            .catch(() => !off && setRows([]));
        return () => {
            off = true;
        };
    }, []);

    if (rows === null) return <Empty icon={<Ticket className="size-6" strokeWidth={1.5} />} text="Memuat tiket..." />;
    if (rows.length === 0) return <Empty icon={<Ticket className="size-6" strokeWidth={1.5} />} text="Belum ada tiket dijual" />;

    return (
        <div>
            <div className={GROUP}>
                {rows.slice(0, 4).map((r) => (
                    <ListRow
                        key={r.id}
                        href={r.href}
                        image={r.poster}
                        tall
                        fallback={<Ticket className="size-6" strokeWidth={1.5} />}
                        eyebrow={
                            <span className={r.available ? 'text-emerald-700 dark:text-emerald-300' : MUTED}>{r.available ? 'Tersedia' : 'Habis'}</span>
                        }
                        title={r.title}
                        lines={[
                            r.starts_at + (r.ends_at && r.ends_at !== r.starts_at ? ' – ' + r.ends_at : ''),
                            r.location,
                            r.ticket_name + ' · ' + rupiah(r.price),
                        ]}
                    />
                ))}
            </div>
            <More href="/tickets" label="Lihat semua tiket" />
        </div>
    );
}

/** Paket: daftar yang bisa dibuka satu per satu. Web menampilkan 3 paket. */
export function PackagePanel({ packages, all }: { packages: PackageCard[]; all?: boolean }) {
    const list = all ? packages : packages.slice(0, 3);
    const [open, setOpen] = useState<number | null>(list.find((p) => p.featured)?.id ?? list[0]?.id ?? null);

    if (list.length === 0) return <Empty icon={<Ticket className="size-6" strokeWidth={1.5} />} text="Belum ada paket" />;

    return (
        <div>
            <div className={GROUP}>
                {list.map((p) => {
                    const t = themes[p.slug] ?? themes.ticketing;
                    const Icon = t.icon;
                    const on = open === p.id;
                    return (
                        <div key={p.id}>
                            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : p.id)} className={'flex w-full items-center gap-3.5 p-3.5 text-left ' + PRESS}>
                                <span className={'flex size-11 shrink-0 items-center justify-center rounded-full text-slate-800 dark:text-slate-100 ' + FIELD}>
                                    <Icon className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="truncate text-[16px] font-semibold text-slate-900 dark:text-white">Paket {p.name}</span>
                                        {p.featured && <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase dark:bg-indigo-500">Populer</span>}
                                    </span>
                                    <span className={'block truncate text-[13px] ' + MUTED}>
                                        {p.price.main}
                                        {p.price.note ? ' · ' + p.price.note : ''}
                                    </span>
                                </span>
                                <ChevronDown className={'size-5 shrink-0 transition-transform ' + MUTED + (on ? ' rotate-180' : '')} />
                            </button>

                            {on && (
                                <div className="px-3.5 pb-4">
                                    {p.tagline && <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{p.tagline}</p>}
                                    <p className={'mt-1 text-[13px] leading-relaxed ' + MUTED}>{t.desc}</p>

                                    {p.specs.length > 0 && (
                                        <dl className="mt-3 divide-y divide-slate-900/[0.07] border-y border-slate-900/[0.07] text-xs dark:divide-white/10 dark:border-white/10">
                                            {p.specs.map(([k, v]) => (
                                                <div key={k} className="flex items-center justify-between gap-3 py-2">
                                                    <dt className={MUTED}>{k}</dt>
                                                    <dd className="text-right font-semibold text-slate-900 dark:text-white">{v}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}

                                    <ul className="mt-3 space-y-2 text-[13px] text-slate-800 dark:text-slate-100">
                                        {p.extends && <li className={'font-medium ' + MUTED}>Semua fitur {p.extends}, ditambah:</li>}
                                        {p.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2.5">
                                                <Check className="size-4 shrink-0 text-indigo-700 dark:text-indigo-300" strokeWidth={2.5} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={p.join_url}
                                        className={'mt-4 flex h-12 items-center justify-center rounded-full text-sm font-medium ' + PRESS + (p.featured ? ' bg-indigo-600 text-white dark:bg-indigo-500' : ' bg-slate-900 text-white dark:bg-white dark:text-slate-900')}
                                    >
                                        Mulai Sekarang
                                    </Link>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {!all && <More href="/paket" label="Lihat semua paket" />}
        </div>
    );
}

/** Berita: 3 terbaru, daftar baris. */
export function NewsPanel({ items }: { items: NewsCard[] }) {
    if (items.length === 0) return <Empty icon={<Newspaper className="size-6" strokeWidth={1.5} />} text="Belum ada berita" />;

    return (
        <div>
            <div className="space-y-4">
                {items.slice(0, 3).map((n) => (
                    <Link key={n.id} href={'/berita/' + n.slug} className={'block overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200 dark:bg-neutral-800">
                            {n.cover_url ? (
                                <img src={n.cover_url} alt={n.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <Newspaper className="size-8" strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            {n.date && <p className={'text-[11px] font-medium ' + MUTED}>{n.date}</p>}
                            <h3 className="mt-1 line-clamp-2 text-[16px] leading-snug font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                            {n.summary && <p className={'mt-1.5 line-clamp-2 text-xs leading-relaxed ' + MUTED}>{n.summary}</p>}
                        </div>
                    </Link>
                ))}
            </div>
            <More href="/berita" label="Lihat semua berita" />
        </div>
    );
}
