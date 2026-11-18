import PanelLayout from '@/components/panel/panel-layout';
import { Link } from '@inertiajs/react';
import { Banknote, ChevronRight, Clock, Layers, ScanLine, UserCheck, UserX, Users } from 'lucide-react';

type Sum = { total: number; lunas: number; menunggu: number; batal: number; revenue: number; tickets: number; hadir: number };
type Sub = Sum & { id: number; title: string };
type TypeRow = { sub: string; name: string; price: number; quota: number; sold: number; hadir: number; revenue: number };
type Props = {
    isParent: boolean;
    summary: Sum;
    subs: Sub[];
    types: TypeRow[];
    cats: { name: string; n: number }[];
    trend: { date: string; n: number }[];
};

const box = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const th = 'px-3 py-3';

export default function Laporan({ isParent, summary: s, subs, types, cats, trend }: Props) {
    const pct = s.tickets > 0 ? Math.round((s.hadir / s.tickets) * 100) : 0;
    const max = Math.max(1, ...trend.map((t) => t.n));
    const stats = [
        { label: 'Total peserta', value: String(s.total), Icon: Users, tone: 'bg-indigo-100 text-indigo-600' },
        { label: 'Terdaftar (lunas)', value: String(s.lunas), Icon: UserCheck, tone: 'bg-emerald-100 text-emerald-600' },
        { label: 'Menunggu', value: String(s.menunggu), Icon: Clock, tone: 'bg-amber-100 text-amber-600' },
        { label: 'Batal / kedaluwarsa', value: String(s.batal), Icon: UserX, tone: 'bg-slate-200 text-slate-600' },
        { label: 'Pendapatan', value: rp(s.revenue), Icon: Banknote, tone: 'bg-violet-100 text-violet-600' },
        { label: 'Kehadiran', value: s.tickets > 0 ? `${s.hadir}/${s.tickets} (${pct}%)` : '-', Icon: ScanLine, tone: 'bg-sky-100 text-sky-600' },
    ];

    return (
        <PanelLayout title="Laporan">
            <div className="space-y-5">
                <div className={`${box} flex items-start gap-5 p-6`}>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                        <Layers className="size-6" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold">{isParent ? 'Laporan gabungan' : 'Laporan event'}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {isParent
                                ? 'Angka dijumlahkan dari semua sub-event. Halaman ini hanya untuk melihat; pengelolaan dilakukan di menu sub-event.'
                                : 'Rekap pendaftaran, pendapatan, dan kehadiran event ini.'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map(({ label, value, Icon, tone }) => (
                        <div key={label} className={`${box} flex items-center gap-4 p-4`}>
                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></div>
                            <div className="min-w-0">
                                <div className="truncate text-2xl font-extrabold leading-none">{value}</div>
                                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`${box} p-5`}>
                    <h3 className="text-lg font-extrabold">Tren pendaftaran lunas per hari</h3>
                    {trend.length === 0 ? (
                        <p className="py-8 text-center text-sm font-semibold text-slate-500">Belum ada pendaftaran lunas.</p>
                    ) : (
                        <div className="mt-4 flex h-40 items-end gap-2 overflow-x-auto">
                            {trend.map((t) => (
                                <div key={t.date} className="flex h-full min-w-[34px] flex-1 flex-col items-center justify-end gap-1">
                                    <span className="text-[11px] font-bold">{t.n}</span>
                                    <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500" style={{ height: `${Math.max(6, (t.n / max) * 100)}%` }} />
                                    <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">{t.date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isParent && (
                    <div className={`${box} overflow-hidden`}>
                        <h3 className="p-5 text-lg font-extrabold">Perbandingan per sub-event</h3>
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[800px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-3">Sub-event</th>
                                        <th className={th}>Peserta</th>
                                        <th className={th}>Lunas</th>
                                        <th className={th}>Menunggu</th>
                                        <th className={th}>Pendapatan</th>
                                        <th className={th}>Hadir</th>
                                        <th className="px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {subs.map((c) => (
                                        <tr key={c.id} className="align-middle">
                                            <td className="px-5 py-3 font-extrabold">{c.title}</td>
                                            <td className="px-3 py-3 font-semibold">{c.total}</td>
                                            <td className="px-3 py-3 font-semibold">{c.lunas}</td>
                                            <td className="px-3 py-3 font-semibold">{c.menunggu}</td>
                                            <td className="px-3 py-3 font-semibold">{rp(c.revenue)}</td>
                                            <td className="px-3 py-3 font-semibold">{c.tickets > 0 ? `${c.hadir}/${c.tickets}` : '-'}</td>
                                            <td className="px-5 py-3 text-right">
                                                <Link href={`/panel/event/${c.id}/laporan`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800">Detail<ChevronRight className="size-3.5" /></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {types.length > 0 && (
                    <div className={`${box} overflow-hidden`}>
                        <h3 className="p-5 text-lg font-extrabold">Rincian per jenis tiket</h3>
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        {isParent && <th className="px-5 py-3">Sub-event</th>}
                                        <th className={isParent ? th : 'px-5 py-3'}>Tiket</th>
                                        <th className={th}>Harga</th>
                                        <th className={th}>Terjual / kuota</th>
                                        <th className={th}>Hadir</th>
                                        <th className={th}>Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {types.map((t, i) => (
                                        <tr key={`${t.sub}-${t.name}-${i}`} className="align-middle">
                                            {isParent && <td className="px-5 py-3 font-semibold">{t.sub}</td>}
                                            <td className={isParent ? th : 'px-5 py-3'}><span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{t.name}</span></td>
                                            <td className="px-3 py-3 font-extrabold">{t.price > 0 ? rp(t.price) : 'Gratis'}</td>
                                            <td className="px-3 py-3 font-semibold">{t.sold} / {t.quota}</td>
                                            <td className="px-3 py-3 font-semibold">{t.hadir}</td>
                                            <td className="px-3 py-3 font-semibold">{rp(t.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {cats.length > 0 && (
                    <div className={`${box} p-5`}>
                        <h3 className="text-lg font-extrabold">Peserta per kategori</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {cats.map((c) => (
                                <span key={c.name} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{c.name} · {c.n}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PanelLayout>
    );
}
