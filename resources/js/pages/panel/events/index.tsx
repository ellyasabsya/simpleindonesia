import { Link } from '@inertiajs/react';
import { CalendarDays, CirclePlus, MapPin } from 'lucide-react';
import PanelLayout from '@/components/panel/panel-layout';

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
};

const badge = {
    pending: { label: 'Menunggu review', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    published: { label: 'Tayang', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    rejected: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PanelEvents({ events }: { institution: { name: string }; events: Ev[] }) {
    return (
        <PanelLayout title="Event Saya">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-slate-600 dark:text-slate-300">Semua event yang diajukan lembaga Anda.</p>
                <Link
                    href="/panel/ajukan"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25"
                >
                    <CirclePlus className="h-4 w-4" /> Ajukan Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center backdrop-blur dark:border-white/15 dark:bg-white/5">
                    <h2 className="title-gradient text-2xl font-extrabold">Belum ada event</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Ajukan event pertama Anda. Admin akan memeriksanya sebelum tayang.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {events.map((e) => (
                        <article key={e.id} className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
                            <div className="relative aspect-[4/5] max-h-56 w-full bg-gradient-to-b from-indigo-900 via-blue-700 to-purple-600">
                                {e.poster_url && <img src={e.poster_url} alt={e.title} className="absolute inset-0 h-full w-full object-cover" />}
                                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${badge[e.status].style}`}>
                                    {badge[e.status].label}
                                </span>
                            </div>
                            <div className="space-y-2 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{e.category} · {e.package}</p>
                                <h3 className="text-lg font-extrabold leading-tight"><Link href={`/panel/event/${e.id}`} className="hover:text-indigo-700 dark:hover:text-indigo-300">{e.title}</Link></h3>
                                <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4 text-orange-500" />{e.location}</p>
                                <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><CalendarDays className="h-4 w-4 text-indigo-500" />{fmt(e.starts_at)} – {fmt(e.ends_at)}</p>
                                {e.status === 'rejected' && e.rejection_reason && (
                                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">Alasan: {e.rejection_reason}</p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
