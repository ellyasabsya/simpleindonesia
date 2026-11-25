import { Link } from '@inertiajs/react';
import { ArrowLeft, Check, Gavel } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';
import { JuriMobile } from '@/components/mobile/pages/saya-mobile';
import { usePhone } from '@/components/mobile/use-phone';

type Row = {
    id: number;
    event: string;
    parent: string | null;
    category: string | null;
    token: string;
    total: number;
    done: number;
    status: 'selesai' | 'berjalan' | 'belum' | 'kosong';
    locked: boolean;
};

export default function Juri({ rows = [], pending = [] }: { rows?: Row[]; pending?: string[] }) {
    const finished = rows.filter((r) => r.status === 'selesai').length;
    const phone = usePhone();

    if (phone) {
        return (
            <UserLayout title="Panel juri" hasPanel={false}>
                <JuriMobile rows={rows} pending={pending} />
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Panel juri" hasPanel={false}>
            <div className="space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-extrabold">Panel juri</h1>
                        <p className="mt-1 text-slate-500 dark:text-slate-300">Tugas penilaian Anda.</p>
                    </div>
                    {rows.length > 0 && (
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${
                                finished === rows.length
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                                    : 'bg-white/80 text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200'
                            }`}
                        >
                            {finished === rows.length && <Check className="h-4 w-4" />}
                            {finished} dari {rows.length} tugas selesai
                        </span>
                    )}
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Gavel className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">Belum ada tugas penilaian</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Tugas muncul di sini setelah panitia menugaskan Anda ke sebuah kategori.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {rows.map((r) => {
                            const done = r.status === 'selesai';
                            const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;

                            return (
                                <div
                                    key={r.id}
                                    className={`rounded-3xl p-4 shadow-sm ${
                                        done
                                            ? 'bg-emerald-50/90 ring-2 ring-emerald-400/70 dark:bg-emerald-500/10 dark:ring-emerald-400/40'
                                            : 'bg-white/80 dark:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            {r.parent && <p className="truncate text-xs font-bold uppercase text-slate-400">{r.parent}</p>}
                                            <h2 className="truncate font-extrabold">{r.event}</h2>
                                            {r.category && <p className="text-sm text-slate-500 dark:text-slate-300">Kategori {r.category}</p>}
                                        </div>
                                        <a
                                            href={`/juri/${r.token}`}
                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white ${
                                                done ? 'bg-emerald-600' : 'bg-indigo-600'
                                            }`}
                                        >
                                            <Gavel className="h-4 w-4" /> {done ? 'Lihat nilai' : r.status === 'berjalan' ? 'Lanjutkan' : 'Nilai'}
                                        </a>
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                                            <div
                                                className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        {done ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                                                <Check className="h-3.5 w-3.5" /> Selesai
                                            </span>
                                        ) : r.status === 'kosong' ? (
                                            <span className="text-xs font-bold text-slate-400">Belum ada peserta</span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                                                {r.done}/{r.total} peserta
                                            </span>
                                        )}
                                    </div>
                                    {r.locked && <p className="mt-2 text-xs font-semibold text-slate-400">Penilaian sudah dikunci panitia.</p>}
                                </div>
                            );
                        })}
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
