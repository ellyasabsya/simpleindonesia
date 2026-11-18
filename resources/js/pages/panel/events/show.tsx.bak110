import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import PanelLayout from '@/components/panel/panel-layout';
import { eventMenuIcons } from '@/data/event-menu-icons';

type Ev = {
    id: number;
    title: string;
    category: string;
    location: string;
    starts_at: string;
    ends_at: string;
    status: 'pending' | 'published' | 'rejected';
    rejection_reason: string | null;
    poster_url: string | null;
    package: string;
    share_percent: number | null;
};
type Nav = { title: string; items: { key: string; label: string; href: string }[] };

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const card =
    'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60';

export default function EventDashboard({ event }: { event: Ev }) {
    const { eventNav } = usePage<{ eventNav: Nav }>().props;
    const shortcuts = eventNav.items.filter((i) => i.key !== 'dashboard');

    return (
        <PanelLayout title="Dashboard Event">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                            {event.category} · Paket {event.package}
                            {event.share_percent ? ` (${event.share_percent}%)` : ''}
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold">{event.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-blue-50/90">
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmt(event.starts_at)} – {fmt(event.ends_at)}</span>
                        </div>
                    </div>
                    {event.poster_url && (
                        <img src={event.poster_url} alt={event.title} className="hidden h-32 w-[102px] rounded-xl object-cover shadow-lg ring-2 ring-white/30 sm:block" />
                    )}
                </div>
            </section>

            {event.status === 'pending' && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <Clock className="h-6 w-6 shrink-0" />
                    Event sedang diperiksa admin. Fitur paket terbuka setelah event tayang.
                </div>
            )}
            {event.status === 'rejected' && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                    Event ditolak{event.rejection_reason ? `: ${event.rejection_reason}` : '.'}
                </div>
            )}

            {shortcuts.length > 0 && (
                <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Fitur paket Anda</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {shortcuts.map((s) => {
                            const Icon = eventMenuIcons[s.key] ?? eventMenuIcons.dashboard;
                            return (
                                <Link key={s.key} href={s.href} className={`${card} flex items-center gap-4`}>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <span className="font-extrabold">{s.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </PanelLayout>
    );
}
