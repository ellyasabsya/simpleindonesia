import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import FeaturedSlot from './featured-slot';

const LEFT = ['aspect-[3/4]', 'aspect-[4/5]'];
const RIGHT = ['aspect-[4/5]', 'aspect-[3/4]'];

const fmt = (s: string | null): string | null => {
    if (!s) return null;
    const d = new Date(s.length > 10 ? s : s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
};

const range = (a: string | null, b: string | null): string | null => {
    const x = fmt(a);
    const y = fmt(b);
    if (x && y && x !== y) return x + ' – ' + y;
    return x ?? y;
};

function Poster({ e, ratio }: { e: EventCard; ratio: string }) {
    const sub = [range(e.starts_at, e.ends_at), e.location].filter(Boolean);
    return (
        <Link href={e.href ?? '/events/' + (e.slug ?? e.id)} className="block active:scale-[0.98] transition-transform">
            <div className={'relative w-full overflow-hidden rounded-3xl bg-slate-200 dark:bg-neutral-800 ' + ratio}>
                {e.poster ? (
                    <img src={e.poster} alt={e.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <CalendarDays className="size-8" strokeWidth={1.5} />
                    </div>
                )}
            </div>
            <h3 className="mt-2 line-clamp-2 px-1 text-sm font-bold text-slate-900 dark:text-white">{e.title}</h3>
            {sub.map((t) => (
                <p key={t} className="line-clamp-1 px-1 text-xs text-slate-500 dark:text-slate-400">
                    {t}
                </p>
            ))}
        </Link>
    );
}

export default function EventsGrid({ list }: { list: EventCard[] }) {
    const left = list.filter((_, i) => i % 2 === 0);
    const right = list.filter((_, i) => i % 2 === 1);

    return (
        <div className="grid grid-cols-2 items-start gap-3">
            <div className="space-y-4">
                {left.map((e, i) => (
                    <Poster key={e.id} e={e} ratio={LEFT[i % 2]} />
                ))}
            </div>
            <div className="space-y-4">
                <FeaturedSlot />
                {right.map((e, i) => (
                    <Poster key={e.id} e={e} ratio={RIGHT[(i + 1) % 2]} />
                ))}
            </div>
        </div>
    );
}
