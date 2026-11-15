import { Link } from '@inertiajs/react';
import { CheckCircle2, CirclePlus } from 'lucide-react';
import PanelLayout from '@/components/panel/panel-layout';

type Stat = { label: string; value: number | string; note?: string };

const card =
    'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60';

export default function PanelDashboard({ institution, pending, stats }: { institution: { name: string }; pending: Stat[]; stats: Stat[] }) {
    const total = pending.reduce((sum, p) => sum + Number(p.value), 0);

    return (
        <PanelLayout title="Dashboard Event">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                            Panel Lembaga
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold">{institution.name}</h2>
                        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-blue-50/90">
                            Kelola event, pantau penjualan tiket, voting, dan pendapatan lembaga Anda dalam satu tempat.
                        </p>
                    </div>
                    <Link href="/panel/ajukan" className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-800 shadow-md transition hover:shadow-lg">
                        <CirclePlus className="h-5 w-5" /> Ajukan Event
                    </Link>
                </div>
            </section>

            <div className={`flex items-center gap-3 rounded-2xl border p-4 font-semibold ${total === 0 ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200'}`}>
                <CheckCircle2 className="h-6 w-6" />
                {total === 0 ? 'Semua beres. Tidak ada yang menunggu tindakan.' : `${total} item sedang diproses.`}
            </div>

            <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sedang diproses</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {pending.map((s) => (
                        <div key={s.label} className={card}>
                            <p className="min-h-8 text-[11px] font-bold uppercase leading-snug tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                            <p className="mt-2 text-3xl font-extrabold">{s.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ringkasan lembaga</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((s) => (
                        <div key={s.label} className={card}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                            <p className="title-gradient mt-2 text-3xl font-extrabold">{s.value}</p>
                            {s.note && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.note}</p>}
                        </div>
                    ))}
                </div>
            </section>
        </PanelLayout>
    );
}
