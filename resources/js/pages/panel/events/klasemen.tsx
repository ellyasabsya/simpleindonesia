import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

type Row = { rank: number | null; shared?: boolean; code: string; name?: string; school?: string; judges_done: number; base: number | null; deduction: number | null; penalty: number | null; score: number | null; provisional?: boolean; status?: string };
type Standing = { rank: number; shared: boolean; school: string; points: number; counts: number[]; score_total?: number; why?: string | null; tie?: boolean };
type Cat = { id: number; name: string; sub: string; sub_id: number; locked: boolean; saved: boolean; need: number; unranked: number; table: Row[] };
type Nav = { sub_id: number; sub: string; id: number; name: string };
type Props = {
    title: string;
    back: string;
    self: string;
    ov: { points: number[]; winner_count: number; standings: Standing[]; locked: boolean; saved?: boolean; saved_at?: string | null; provisional?: boolean };
    category: Cat | null;
    nav: Nav[];
};

const num = (n: number | string | null | undefined) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 }));
const badge = (r: number) =>
    `inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-extrabold ${r === 1 ? 'bg-amber-400 text-white' : r === 2 ? 'bg-slate-400 text-white' : r === 3 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`;
const th = 'px-4 py-3';
const head = 'bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-300';

export default function Klasemen({ title, back, self, ov, category, nav }: Props) {
    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`;
    const status = category ? (category.locked ? 'Ditetapkan' : category.saved ? 'Tersimpan' : 'Belum disimpan') : ov.locked ? 'Ditetapkan' : ov.saved ? `Tersimpan · ${ov.saved_at ?? ''}` : ov.provisional ? 'Sementara' : '';
    const winners = ov.standings.filter((s) => s.rank <= ov.winner_count);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={`Klasemen - ${title}`} />
            <div className="mx-auto max-w-6xl space-y-6">
                <Link href={back} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke penilaian
                </Link>

                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{title}</p>
                        <h1 className="mt-1 text-3xl font-extrabold">{category ? `Klasemen ${category.sub} · ${category.name ? `Kategori ${category.name}` : 'Kategori Umum'}` : 'Klasemen juara umum'}</h1>
                    </div>
                    {status && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-900">{status}</span>}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    <Link href={self} className={chip(!category)}>Juara umum</Link>
                    {nav.map((n) => (
                        <Link key={`${n.sub_id}-${n.id}`} href={`${self}?sub=${n.sub_id}&kategori=${n.id}`} className={chip(!!category && category.sub_id === n.sub_id && category.id === n.id)}>
                            {n.sub} · {n.name ? n.name : 'Umum'}
                        </Link>
                    ))}
                </div>

                {category ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className={head}>
                                    <th className={th}>Peringkat</th>
                                    <th className={th}>Peserta</th>
                                    <th className={th}>Asal</th>
                                    <th className={`${th} text-center`}>Juri</th>
                                    <th className={`${th} text-right`}>Nilai dasar</th>
                                    <th className={`${th} text-right`}>Potongan</th>
                                    <th className={`${th} text-right`}>Penalti</th>
                                    <th className={`${th} text-right`}>Nilai akhir</th>
                                    <th className={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                {category.table.length === 0 && (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Belum ada peserta di kategori ini.</td></tr>
                                )}
                                {category.table.map((t, i) => (
                                    <tr key={`${t.code}-${i}`} className={t.rank !== null && t.rank <= 3 ? 'bg-indigo-50/40 dark:bg-indigo-500/5' : ''}>
                                        <td className={th}>{t.rank === null ? <span className="text-slate-400">–</span> : <span className={badge(t.rank)}>{t.rank}{t.shared ? '=' : ''}</span>}</td>
                                        <td className={th}>
                                            <span className="font-extrabold">{t.code}</span>
                                            {t.name ? <span className="block text-xs text-slate-500 dark:text-slate-400">{t.name}</span> : null}
                                        </td>
                                        <td className={`${th} text-slate-600 dark:text-slate-300`}>{t.school || '–'}</td>
                                        <td className={`${th} text-center tabular-nums`}>{t.judges_done}/{category.need}</td>
                                        <td className={`${th} text-right tabular-nums`}>{num(t.base)}</td>
                                        <td className={`${th} text-right tabular-nums ${t.deduction ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.deduction ? num(t.deduction) : '–'}</td>
                                        <td className={`${th} text-right tabular-nums ${t.penalty ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.penalty ? num(t.penalty) : '–'}</td>
                                        <td className={`${th} text-right text-base font-extrabold tabular-nums`}>{num(t.score)}{t.provisional ? <span className="ml-1 text-[10px] font-bold text-amber-600">sementara</span> : null}</td>
                                        <td className={`${th} text-xs font-semibold capitalize text-slate-600 dark:text-slate-300`}>{t.status ?? '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>
                        {winners.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {winners.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 ring-1 ring-emerald-200/70 dark:from-emerald-500/10 dark:to-teal-500/10 dark:ring-emerald-400/20">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow">{s.rank}</span>
                                        <div>
                                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Juara umum {s.rank}{s.shared ? ' (bersama)' : ''}</p>
                                            <p className="text-lg font-extrabold leading-tight">{s.school}</p>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{num(s.points)} poin</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className={head}>
                                        <th className={th}>#</th>
                                        <th className={th}>Peserta</th>
                                        <th className={`${th} text-right`}>Poin</th>
                                        {ov.points.map((_, i) => <th key={i} className="px-3 py-3 text-center">Juara {i + 1}</th>)}
                                        <th className={`${th} text-right`}>Total nilai</th>
                                        <th className={th}>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {ov.standings.length === 0 && (
                                        <tr><td colSpan={ov.points.length + 4} className="px-4 py-8 text-center text-slate-400">Belum ada peringkat yang bisa dihitung.</td></tr>
                                    )}
                                    {ov.standings.map((s, i) => (
                                        <tr key={i} className={s.rank <= ov.winner_count ? 'bg-emerald-50/60 dark:bg-emerald-500/10' : ''}>
                                            <td className={`${th} align-top`}><span className={badge(s.rank)}>{s.rank}{s.shared ? '=' : ''}</span></td>
                                            <td className={`${th} align-top font-extrabold`}>{s.school}</td>
                                            <td className={`${th} text-right align-top`}><span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-base font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{num(s.points)}</span></td>
                                            {s.counts.map((n, k) => (
                                                <td key={k} className="px-3 py-3 text-center align-top">{n > 0 ? <span className="font-extrabold">{n}</span> : <span className="text-slate-300 dark:text-slate-600">–</span>}</td>
                                            ))}
                                            <td className={`${th} text-right align-top tabular-nums text-slate-600 dark:text-slate-300`}>{num(s.score_total ?? 0)}</td>
                                            <td className={`${th} align-top`}>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {s.rank <= ov.winner_count && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900">Juara umum {s.rank}</span>}
                                                    {s.shared && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">Juara bersama</span>}
                                                    {s.tie && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">Seri belum terpecahkan</span>}
                                                </div>
                                                {s.why ? <p className="mt-1 max-w-md text-xs leading-snug text-slate-500 dark:text-slate-300">{s.why}</p> : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
