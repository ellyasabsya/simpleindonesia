import { Link } from '@inertiajs/react';
import { CalendarDays, Layers, MapPin } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import { CARD, MUTED, PRESS } from './soft';

const STATUS: Record<EventCard['status']['key'], string> = {
    berlangsung: 'bg-emerald-400',
    segera: 'bg-sky-400',
    selesai: 'bg-neutral-400',
};

const day = (s: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(s.length > 10 ? s : s + 'T00:00:00'));

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
    /** true = area gambar 16:10 (untuk voting), false = potret 4:5. */
    wide?: boolean;
    /** true = kartu kecil untuk grid 2 kolom. */
    compact?: boolean;
    /** Baris tambahan tebal di bawah (mis. harga per vote). */
    note?: string;
    className?: string;
};

/**
 * Kartu poster: poster tampil UTUH (object-contain) di atas latar buram dari gambar yang sama,
 * judul dan info di bawah gambar dengan teks kontras tinggi.
 */
export default function PosterCard({ event, href, wide, compact, note, className = '' }: Props) {
    const range = eventRange(event.starts_at, event.ends_at);
    const series = !!event.is_series;

    return (
        <Link href={href} className={'block shrink-0 snap-start overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS + ' ' + className}>
            <div className={'relative overflow-hidden bg-slate-200 dark:bg-neutral-800 ' + (wide ? 'aspect-[16/10]' : 'aspect-[4/5]')}>
                {event.poster ? (
                    <>
                        <img src={event.poster} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
                        <img src={event.poster} alt={event.title} loading="lazy" className="relative size-full object-contain" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(120%_90%_at_20%_0%,#4f46e5_0%,#1e1b4b_55%,#0b0a1f_100%)]">
                        <span className="text-7xl font-semibold tracking-tight text-white/25">{initials(event.title)}</span>
                    </div>
                )}

                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-white/20">
                    <span className={'size-1.5 rounded-full ' + STATUS[event.status.key]} />
                    {event.status.label}
                </span>
                {series && !compact && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                        <Layers className="size-3.5" />
                        {event.sub_count ? event.sub_count + ' acara' : 'Rangkaian'}
                    </span>
                )}
            </div>

            <div className={compact ? 'p-3' : 'p-4'}>
                {event.category && !compact && <p className="mb-1 text-[11px] font-medium tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{event.category}</p>}
                <h3 className={'line-clamp-2 leading-tight font-semibold tracking-tight text-slate-900 dark:text-white ' + (compact ? 'text-[14px]' : 'text-[19px]')}>{event.title}</h3>
                <div className={'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ' + MUTED}>
                    {range && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {range}
                        </span>
                    )}
                    {event.location && !compact && (
                        <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </span>
                    )}
                </div>
                {note && <p className="mt-1.5 text-xs font-bold text-slate-900 dark:text-white">{note}</p>}
            </div>
        </Link>
    );
}
