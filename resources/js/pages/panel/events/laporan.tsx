import PanelLayout from '@/components/panel/panel-layout';
import { Link } from '@inertiajs/react';
import { useId } from 'react';
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

const box = 'rounded-2xl border border-white/70 bg-white/80 shadow-sm md:rounded-3xl md:backdrop-blur dark:border-white/10 dark:bg-white/5';
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const th = 'px-3 py-3';

function TrenLunas({ trend }: { trend: { date: string; n: number }[] }) {
    const gid = 'tren' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const W = 640;
    const H = 220;
    const L = 34;
    const R = 20;
    const T = 28;
    const B = 34;
    const top = Math.max(1, ...trend.map((t) => t.n));
    const step = top <= 4 ? 1 : Math.ceil(top / 4);
    const yMax = Math.ceil(top / step) * step;
    const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);
    const px = (i: number) => (trend.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (trend.length - 1));
    const py = (n: number) => T + (1 - n / yMax) * (H - T - B);
    const pts = trend.map((t, i) => ({ x: px(i), y: py(t.n), t }));
    let line = '';
    pts.forEach((p, i) => {
        if (i === 0) line = `M${p.x},${p.y}`;
        else {
            const q = pts[i - 1];
            const cx = (q.x + p.x) / 2;
            line += ` C${cx},${q.y} ${cx},${p.y} ${p.x},${p.y}`;
        }
    });
    const base = H - B;
    const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z` : '';
    const every = Math.max(1, Math.ceil(pts.length / 8));

    return (
        <div className="mt-3 w-full overflow-x-auto md:mt-4 md:overflow-visible">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px] md:min-w-0" role="img" aria-label="Grafik tren pendaftaran lunas per hari">
                <defs>
                    <linearGradient id={`${gid}a`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id={`${gid}l`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                {ticks.map((v) => (
                    <g key={v}>
                        <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.25 : 0.1} strokeDasharray={v === 0 ? undefined : '4 4'} />
                        <text x={L - 8} y={py(v) + 4} textAnchor="end" className="fill-slate-500" fontSize="11" fontWeight="600">{v}</text>
                    </g>
                ))}
                {pts.length === 1 && <line x1={pts[0].x} x2={pts[0].x} y1={pts[0].y} y2={base} stroke="#8b5cf6" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 4" />}
                {area && <path d={area} fill={`url(#${gid}a)`} />}
                {pts.length > 1 && <path d={line} fill="none" stroke={`url(#${gid}l)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                {pts.map((p, i) => (
                    <g key={p.t.date}>
                        <circle cx={p.x} cy={p.y} r="9" fill="#8b5cf6" fillOpacity="0.18" />
                        <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#6d28d9" strokeWidth="3" />
                        <text x={p.x} y={p.y - 14} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100" fontSize="13" fontWeight="800">{p.t.n}</text>
                        {i % every === 0 && <text x={p.x} y={H - 10} textAnchor="middle" className="fill-slate-500" fontSize="11" fontWeight="600">{p.t.date}</text>}
                    </g>
                ))}
            </svg>
        </div>
    );
}

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
            <div className="space-y-3 pb-24 md:space-y-5 md:pb-0">
                <div className={`${box} flex items-start gap-3 p-3 md:gap-5 md:p-6`}>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white md:size-12 md:bg-gradient-to-br md:from-violet-600 md:to-indigo-600 md:shadow-lg md:shadow-violet-500/30">
                        <Layers className="size-6" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-semibold md:text-xl md:font-extrabold">{isParent ? 'Laporan gabungan' : 'Laporan event'}</h2>
                        <p className="mt-1 text-[13px] text-slate-600 md:text-sm md:text-slate-500">
                            {isParent
                                ? 'Angka dijumlahkan dari semua sub-event. Halaman ini hanya untuk melihat; pengelolaan dilakukan di menu sub-event.'
                                : 'Rekap pendaftaran, pendapatan, dan kehadiran event ini.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-3">
                    {stats.map(({ label, value, Icon, tone }) => (
                        <div key={label} className={`${box} flex items-center gap-2.5 p-3 md:gap-4 md:p-4`}>
                            <div className={`hidden size-10 shrink-0 items-center justify-center rounded-xl md:flex ${tone}`}><Icon className="size-5" /></div>
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold leading-none md:text-2xl md:font-extrabold">{value}</div>
                                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`${box} p-3 md:p-5`}>
                    <h3 className="text-[15px] font-semibold md:text-lg md:font-extrabold">Tren pendaftaran lunas per hari</h3>
                    {trend.length === 0 ? (
                        <p className="py-8 text-center text-sm font-semibold text-slate-500">Belum ada pendaftaran lunas.</p>
                    ) : (
                        <TrenLunas trend={trend} />
                    )}
                </div>

                {isParent && (
                    <div className={`${box} overflow-hidden`}>
                        <h3 className="p-3 text-[15px] font-semibold md:p-5 md:text-lg md:font-extrabold">Perbandingan per sub-event</h3>
                        <div className="space-y-2 border-t border-slate-200 p-3 md:hidden dark:border-white/10">
                            {subs.map((c) => (
                                <div key={`m-${c.id}`} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                                    <div className="truncate text-sm font-semibold">{c.title}</div>
                                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                                        {([['Peserta', String(c.total)], ['Lunas', String(c.lunas)], ['Menunggu', String(c.menunggu)]] as [string, string][]).map(([l, v]) => (
                                            <div key={l}>
                                                <div className="text-[13px] font-semibold">{v}</div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{l}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2 text-[13px]">
                                        <span className="font-semibold">{rp(c.revenue)}</span>
                                        <span className="text-slate-600 dark:text-slate-300">Hadir {c.tickets > 0 ? `${c.hadir}/${c.tickets}` : '-'}</span>
                                    </div>
                                    <Link href={`/panel/event/${c.id}/laporan`} className="mt-2 flex h-10 items-center justify-center gap-1 rounded-full bg-indigo-600 text-sm font-medium text-white">Detail<ChevronRight className="size-4" /></Link>
                                </div>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto border-t border-slate-200 md:block dark:border-white/10">
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
                        <h3 className="p-3 text-[15px] font-semibold md:p-5 md:text-lg md:font-extrabold">Rincian per jenis tiket</h3>
                        <div className="space-y-2 border-t border-slate-200 p-3 md:hidden dark:border-white/10">
                            {types.map((t, i) => (
                                <div key={`m-${t.sub}-${t.name}-${i}`} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            {isParent && <div className="truncate text-sm font-semibold">{t.sub}</div>}
                                            <span className="mt-1 inline-block max-w-full truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{t.name}</span>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold">{t.price > 0 ? rp(t.price) : 'Gratis'}</span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                                        {([['Terjual', t.sold + ' / ' + t.quota], ['Hadir', String(t.hadir)], ['Pendapatan', rp(t.revenue)]] as [string, string][]).map(([l, v]) => (
                                            <div key={l} className="min-w-0">
                                                <div className="truncate text-[13px] font-semibold">{v}</div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{l}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto border-t border-slate-200 md:block dark:border-white/10">
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
                    <div className={`${box} p-3 md:p-5`}>
                        <h3 className="text-[15px] font-semibold md:text-lg md:font-extrabold">Peserta per kategori</h3>
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
