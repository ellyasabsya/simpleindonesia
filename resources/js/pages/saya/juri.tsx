import { Link } from '@inertiajs/react';
import { ArrowLeft, Gavel } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';

type Row = { id: number; event: string; parent: string | null; category: string | null; token: string };

export default function Juri({ rows = [], pending = [] }: { rows?: Row[]; pending?: string[] }) {
    return (
        <UserLayout title="Panel juri" hasPanel={false}>
            <div className="space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold">Panel juri</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">Tugas penilaian Anda.</p>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Gavel className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">Belum ada tugas penilaian</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Tugas muncul di sini setelah panitia menugaskan Anda ke sebuah kategori.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {rows.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 p-4 shadow-sm dark:bg-white/5">
                                <div className="min-w-0">
                                    {r.parent && <p className="truncate text-xs font-bold uppercase text-slate-400">{r.parent}</p>}
                                    <h2 className="truncate font-extrabold">{r.event}</h2>
                                    {r.category && <p className="text-sm text-slate-500 dark:text-slate-300">Kategori {r.category}</p>}
                                </div>
                                <a href={`/juri/${r.token}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
                                    <Gavel className="h-4 w-4" /> Nilai
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {pending.length > 0 && (
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                        Menunggu penugasan kategori dari panitia: {pending.join(', ')}.
                    </p>
                )}
            </div>
        </UserLayout>
    );
}
