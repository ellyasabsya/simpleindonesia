import { Link } from '@inertiajs/react';
import { CalendarDays, Layers, MapPin } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';

const STATUS: Record<EventCard['status']['key'], string> = {
    berlangsung: 'bg-emerald-500',
    segera: 'bg-blue-600',
    selesai: 'bg-neutral-600',
};

const day = (s: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(s + 'T00:00:00'));

export function eventRange(start: string | null, end: string | null): string | null {
    if (!start && !end) return null;
    if (!start || !end || start === end) return day((start ?? end)!);
    return day(start) + ' – ' + day(end);
}

const initials = (t: string) =>
    t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

type Props = {
    event: EventCard;
    href: string;
    /** true = lebar 16:10 (untuk voting), false = potret 4:5. */
    wide?: boolean;
    className?: string;
};

/** Kartu poster penuh: foto jadi pusat, judul putih di atas gradasi gelap. */
export default function PosterCard({ event, href, wide, className = '' }: Props) {
    const range = eventRange(event.starts_at, event.ends_at);
    const series = !!event.is_series;

    return (
        <Link
            href={href}
            className={
                'group relative block shrink-0 snap-start overflow-hidden rounded-[28px] bg-neutral-200 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.45)] transition-transform duration-200 active:scale-[0.97] dark:bg-neutral-800 ' +
                (wide ? 'aspect-[16/10] ' : 'aspect-[4/5] ') +
                className
            }
        >
            {event.poster ? (
                <img src={event.poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
                    <span className="text-6xl font-black tracking-wide text-white/90">{initials(event.title)}</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <span className={'absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-lg ' + STATUS[event.status.key]}>
                <span className="size-1.5 rounded-full bg-white" />
                {event.status.label}
            </span>
            {series && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Layers className="size-3.5" />
                    {event.sub_count ? event.sub_count + ' acara' : 'Rangkaian'}
                </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-4">
                {event.category && <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">{event.category}</p>}
                <h3 className="line-clamp-2 text-[19px] leading-tight font-extrabold text-white">{event.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/80">
                    {range && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {range}
                        </span>
                    )}
                    {event.location && (
                        <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
