import { Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, MapPin, Trophy } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';

type Row = { id: number; status: string; title: string | null; category: string | null; location: string | null; starts_at: string | null; poster: string | null };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

export default function Lomba({ rows = [] }: { rows?: Row[] }) {
    return (
        <UserLayout title="Lomba saya" hasPanel={false}>
            <div className="space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold">Lomba saya</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">Semua lomba yang Anda ikuti.</p>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Trophy className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">Belum ada lomba yang diikuti</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Lomba yang Anda daftar akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {rows.map((r) => (
                            <div key={r.id} className="flex gap-4 rounded-3xl bg-white/80 p-4 shadow-sm dark:bg-white/5">
                                {r.poster ? (
                                    <img src={r.poster} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                                ) : (
                                    <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                                        <Trophy className="h-8 w-8" />
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="truncate font-extrabold">{r.title ?? '(event dihapus)'}</h2>
                                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold capitalize text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{r.status}</span>
                                    </div>
                                    {r.category && <p className="text-sm text-slate-500 dark:text-slate-300">{r.category}</p>}
                                    <p className="mt-2 flex items-center gap-1.5 text-sm"><CalendarDays className="h-4 w-4" /> {fmt(r.starts_at)}</p>
                                    {r.location && <p className="flex items-center gap-1.5 text-sm"><MapPin className="h-4 w-4" /> {r.location}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
