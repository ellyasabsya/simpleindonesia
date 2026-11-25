import { CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';

type Stat = { label: string; value: number | string; note?: string };

export default function AdminDashboard({ pending, platform }: { pending: Stat[]; platform: Stat[] }) {
    const total = pending.reduce((sum, p) => sum + Number(p.value), 0);

    return (
        <AdminLayout title="Admin Panel">
            {/* Banner */}
            <section className="relative overflow-hidden rounded-2xl bg-indigo-600 md:bg-gradient-to-br md:from-indigo-700 md:via-blue-600 md:to-violet-600 px-4 py-3 text-white shadow-sm md:rounded-3xl md:px-7 md:py-6 md:shadow-lg md:shadow-indigo-500/20">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl max-md:hidden" />
                <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold max-md:hidden max-md:normal-case max-md:tracking-normal md:uppercase md:tracking-[0.25em]">
                        Admin Workspace
                    </span>
                    <h2 className="text-base font-semibold md:mt-3 md:text-2xl md:font-extrabold">Ringkasan</h2>
                    <p className="mt-0.5 max-w-2xl line-clamp-2 text-xs leading-snug text-blue-50/90 md:mt-2 md:line-clamp-none md:text-sm md:leading-relaxed">
                        Lihat apa yang perlu ditindaklanjuti dan kondisi platform saat ini. Laporan keuangan ada di menu
                        Pendapatan.
                    </p>
                </div>
            </section>

            {/* Status tindakan */}
            <div
                className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-xs font-semibold md:gap-3 md:p-4 md:text-base ${
                    total === 0
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200'
                }`}
            >
                <CheckCircle2 className="h-5 w-5 shrink-0 md:h-6 md:w-6" />
                {total === 0 ? 'Semua beres. Tidak ada yang menunggu tindakan.' : `${total} item menunggu tindakan Anda.`}
            </div>

            {/* Perlu tindakan */}
            <section>
                <h3 className="mb-1.5 text-xs font-semibold text-slate-500 md:mb-3 md:text-sm md:font-bold md:uppercase md:tracking-[0.18em] dark:text-slate-400">
                    Perlu tindakan
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-5">
                    {pending.map((s) => (
                        <div
                            key={s.label}
                            className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-none md:block md:border-white/70 md:bg-white/80 md:p-5 md:shadow-sm md:backdrop-blur md:transition md:hover:-translate-y-0.5 md:hover:shadow-md dark:border-white/10 dark:bg-slate-900/60"
                        >
                            <p className="min-w-0 text-xs font-medium leading-snug text-slate-600 md:min-h-8 md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-slate-500 dark:text-slate-400">
                                {s.label}
                            </p>
                            <p className="text-lg leading-none font-semibold tabular-nums md:mt-2 md:text-3xl md:font-extrabold">{s.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Platform */}
            <section>
                <h3 className="mb-1.5 text-xs font-semibold text-slate-500 md:mb-3 md:text-sm md:font-bold md:uppercase md:tracking-[0.18em] dark:text-slate-400">
                    Platform
                </h3>
                <div className="grid grid-cols-2 gap-2 max-md:mb-24 md:gap-4 xl:grid-cols-4">
                    {platform.map((s) => (
                        <div
                            key={s.label}
                            className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-none md:block md:border-white/70 md:bg-white/80 md:p-5 md:shadow-sm md:backdrop-blur md:transition md:hover:-translate-y-0.5 md:hover:shadow-md dark:border-white/10 dark:bg-slate-900/60"
                        >
                            <p className="min-w-0 text-xs font-medium leading-snug text-slate-600 md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-slate-500 dark:text-slate-400">
                                {s.label}
                            </p>
                            <p className="title-gradient max-md:!bg-none max-md:!text-indigo-600 max-md:![-webkit-text-fill-color:currentColor] max-md:dark:!text-indigo-300 text-lg leading-none font-semibold tabular-nums md:mt-2 md:text-3xl md:font-extrabold">{s.value}</p>
                            {s.note && <p className="mt-1 text-xs text-slate-500 max-md:hidden dark:text-slate-400">{s.note}</p>}
                        </div>
                    ))}
                </div>
            </section>
        </AdminLayout>
    );
}
