import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Crown, Medal, Printer, Star, Trophy, Users } from 'lucide-react';

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
type Pod = { rank: number; name: string; sub?: string; value: string };

const num = (n: number | string | null | undefined) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 }));

const TONES = ['gold', 'silver', 'bronze'] as const;
type Tone = (typeof TONES)[number];
const TONE: Record<Tone, { a: string; b: string; c: string; ped: string; pill: string }> = {
    gold: { a: '#FDE68A', b: '#F59E0B', c: '#B45309', ped: 'from-amber-100 via-amber-200 to-amber-400', pill: 'bg-amber-500' },
    silver: { a: '#F1F5F9', b: '#94A3B8', c: '#475569', ped: 'from-slate-100 via-slate-200 to-slate-300', pill: 'bg-slate-500' },
    bronze: { a: '#FED7AA', b: '#EA580C', c: '#9A3412', ped: 'from-orange-100 via-orange-200 to-orange-300', pill: 'bg-orange-600' },
};
const CONFETTI = ['#FBBF24', '#2563EB', '#14B8A6', '#F59E0B', '#1D4ED8'];
const script = { fontFamily: "'Dancing Script', 'Brush Script MT', cursive" };

function TrophyIcon({ n, tone, className }: { n: number; tone: Tone; className?: string }) {
    const t = TONE[tone];
    const id = `tg-${tone}`;
    return (
        <svg viewBox="0 0 120 140" className={className} aria-hidden>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={t.a} />
                    <stop offset=".5" stopColor={t.b} />
                    <stop offset="1" stopColor={t.c} />
                </linearGradient>
            </defs>
            <path d="M30 14h60v36c0 22-14 34-30 34S30 72 30 50z" fill={`url(#${id})`} />
            <path d="M30 22H14c0 24 10 36 24 40M90 22h16c0 24-10 36-24 40" fill="none" stroke={`url(#${id})`} strokeWidth="7" strokeLinecap="round" />
            <path d="M38 20h10c-2 30 2 50 12 58-14-2-22-16-22-34z" fill="#fff" opacity=".35" />
            <rect x="53" y="84" width="14" height="22" fill={`url(#${id})`} />
            <rect x="34" y="104" width="52" height="10" rx="3" fill={`url(#${id})`} />
            <rect x="26" y="114" width="68" height="14" rx="3" fill={t.c} />
            <text x="60" y="58" textAnchor="middle" fontSize="34" fontWeight="900" fill="#fff" stroke={t.c} strokeWidth="1">{n}</text>
        </svg>
    );
}

function Laurel({ flip, className }: { flip?: boolean; className?: string }) {
    const nodes = Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        return { x: 14 + 26 * Math.sin(t * Math.PI * 0.9), y: 92 - t * 84, r: -20 + t * 40 };
    });
    return (
        <svg viewBox="0 0 60 100" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
            {nodes.map((p, i) => (
                <g key={i}>
                    <ellipse cx={p.x - 5} cy={p.y} rx="4.5" ry="10" transform={`rotate(${p.r - 35} ${p.x - 5} ${p.y})`} fill="#F5B301" />
                    <ellipse cx={p.x + 5} cy={p.y - 3} rx="4.5" ry="10" transform={`rotate(${p.r + 35} ${p.x + 5} ${p.y - 3})`} fill="#E09A00" />
                </g>
            ))}
        </svg>
    );
}

function Confetti() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 40 }, (_, i) => (
                <span key={i} className="absolute block h-2.5 w-1.5 rounded-[1px]" style={{ left: `${(i * 29 + 7) % 100}%`, top: `${(i * 17 + 5) % 62}%`, background: CONFETTI[i % 5], transform: `rotate(${i * 37}deg)`, opacity: 0.85 }} />
            ))}
        </div>
    );
}

function Rank({ r, shared }: { r: number | null; shared?: boolean }) {
    if (r === null) return <span className="text-slate-400">–</span>;
    const cls = r === 1 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-white' : r === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-500 text-white' : r === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-700 text-white' : 'bg-blue-100 text-blue-900';
    return <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-black shadow ring-2 ring-white ${cls}`}>{r}{shared ? '=' : ''}</span>;
}

const rowTint = (r: number | null) => (r === 1 ? 'bg-amber-100' : r === 2 ? 'bg-sky-100' : r === 3 ? 'bg-orange-100' : 'bg-white');

function Podium({ items }: { items: Pod[] }) {
    const heights = ['h-44', 'h-36', 'h-32'];
    const sizes = ['w-36 sm:w-44', 'w-28 sm:w-32', 'w-24 sm:w-28'];
    const order = [1, 0, 2].map((pos) => ({ it: items[pos], pos })).filter((x) => x.it);
    return (
        <div className="relative mt-8">
            <div className="mx-auto flex max-w-3xl items-end justify-center px-4">
                {order.map(({ it, pos }) => {
                    const tone = TONES[pos];
                    const t = TONE[tone];
                    return (
                        <div key={pos} className={`flex flex-1 flex-col items-center ${pos === 0 ? 'z-10' : ''}`}>
                            <TrophyIcon n={it.rank} tone={tone} className={`${sizes[pos]} -mb-2 drop-shadow-xl`} />
                            <div className={`flex w-full flex-col items-center justify-center rounded-t-xl bg-gradient-to-b px-2 text-center shadow-lg ring-1 ring-white/70 ${t.ped} ${heights[pos]}`}>
                                <span className={`rounded-full px-4 py-0.5 text-xs font-extrabold text-white ${t.pill}`}>Juara {it.rank}</span>
                                <p className="mt-1.5 max-w-full break-words text-lg font-extrabold leading-tight text-blue-950 sm:text-xl">{it.name}</p>
                                {it.sub ? <p className="text-[11px] font-semibold text-blue-900/70">{it.sub}</p> : null}
                                <span className={`mt-2 rounded-full px-3 py-0.5 text-sm font-extrabold text-white ${t.pill}`}>{it.value}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mx-auto -mt-1 h-6 max-w-4xl rounded-[50%] bg-gradient-to-r from-amber-200 via-white to-amber-200 shadow-[0_0_30px_rgba(251,191,36,.8)]" />
        </div>
    );
}

function Stat({ icon: Icon, label, v }: { icon: typeof Star; label: string; v: string | number }) {
    return (
        <div className="flex-1 text-center">
            <Icon className="mx-auto h-7 w-7 text-amber-500" />
            <p className="mt-1 text-sm font-bold text-blue-900">{label}</p>
            <p className="text-3xl font-black text-blue-950">{v}</p>
        </div>
    );
}

function Hero({ s, title }: { s: Standing; title: string }) {
    return (
        <div className="relative mx-auto mt-4 max-w-3xl px-4 text-center">
            <div className="mx-auto flex w-fit items-end justify-center">
                <Laurel className="mb-10 h-28 w-14" />
                <TrophyIcon n={1} tone="gold" className="w-56 drop-shadow-2xl" />
                <Laurel flip className="mb-10 h-28 w-14" />
            </div>
            <div className="relative z-10 mx-auto -mt-12 w-[92%] rounded-xl bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 py-3 shadow-xl ring-2 ring-amber-200">
                <p className="text-3xl font-black tracking-wide text-blue-950 sm:text-5xl">JUARA UMUM</p>
            </div>
            <div className="relative mx-auto w-[70%] rounded-b-2xl bg-gradient-to-b from-amber-100 to-amber-300 px-4 py-3 text-2xl font-black text-blue-950 shadow-lg ring-1 ring-amber-300 sm:text-3xl">{s.school}</div>

            <div className="relative mx-auto mt-10 max-w-2xl">
                <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-blue-900 px-6 py-1.5 text-sm font-extrabold text-white shadow">Rincian Prestasi</span>
                <div className="flex divide-x divide-amber-200 rounded-2xl bg-white/95 px-2 py-6 shadow-xl ring-1 ring-amber-200">
                    <Stat icon={Star} label="Total Poin" v={num(s.points)} />
                    {s.counts.slice(0, 4).map((c, i) => <Stat key={i} icon={i === 0 ? Crown : Medal} label={`Juara ${i + 1}`} v={c} />)}
                </div>
            </div>

            <p className="mt-8 text-4xl text-blue-950" style={script}>Selamat kepada {s.school}</p>
            <p className="mt-1 text-sm font-semibold text-blue-950">atas prestasinya sebagai <b>Juara Umum</b> {title}</p>
        </div>
    );
}

const hd = 'px-4 py-3.5';

export default function Klasemen({ title, back, self, ov, category, nav }: Props) {
    const status = category ? (category.locked ? 'Ditetapkan' : category.saved ? 'Tersimpan' : 'Belum disimpan') : ov.locked ? 'Ditetapkan' : ov.saved ? `Tersimpan · ${ov.saved_at ?? ''}` : ov.provisional ? 'Sementara' : '';
    const chip = (on: boolean) => `whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold shadow-sm ring-1 transition ${on ? 'bg-blue-800 text-white ring-blue-900' : 'bg-white/85 text-blue-900 ring-white hover:bg-white'}`;

    const winners = ov.standings.filter((s) => s.rank <= ov.winner_count);
    const single = !category && ov.winner_count === 1 && winners.length === 1;
    const pods: Pod[] = category
        ? category.table.filter((t) => t.rank !== null).slice(0, 3).map((t) => ({ rank: t.rank as number, name: t.name || t.code, sub: t.name ? t.code : t.school || undefined, value: `${num(t.score)} nilai` }))
        : ov.standings.slice(0, 3).map((s) => ({ rank: s.rank, name: s.school, value: `${num(s.points)} Poin` }));

    const heading = category ? `Klasemen ${category.sub} · ${category.name ? `Kategori ${category.name}` : 'Kategori Umum'}` : 'Klasemen Juara Umum';
    const head = 'bg-gradient-to-b from-blue-800 to-blue-950 text-sm font-extrabold text-white';

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-white text-slate-900">
            <Head title={`Klasemen - ${title}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
            </Head>
            <style>{`@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,.95),transparent_55%)]" />
            <div className="pointer-events-none absolute -left-24 top-24 h-12 w-96 -rotate-[28deg] bg-gradient-to-r from-blue-800 to-blue-500 shadow-lg" />
            <div className="pointer-events-none absolute -left-24 top-36 h-5 w-96 -rotate-[28deg] bg-gradient-to-r from-amber-400 to-amber-200" />
            <div className="pointer-events-none absolute -right-24 top-24 h-12 w-96 rotate-[28deg] bg-gradient-to-l from-blue-800 to-blue-500 shadow-lg" />
            <div className="pointer-events-none absolute -right-24 top-36 h-5 w-96 rotate-[28deg] bg-gradient-to-l from-amber-400 to-amber-200" />
            <Confetti />

            <div className="relative z-10 mx-auto max-w-5xl px-4 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 40 44" className="h-11 w-11" aria-hidden>
                            <path d="M20 2C11 2 5 8.5 5 16.5 5 27 20 42 20 42s15-15 15-25.5C35 8.5 29 2 20 2z" fill="#F59E0B" />
                            <circle cx="20" cy="16" r="6" fill="#0E7490" />
                            <path d="M8 34c6-6 18-6 24 0-6 4-18 4-24 0z" fill="#1E3A8A" />
                        </svg>
                        <div>
                            <p className="text-3xl font-black leading-none tracking-tight text-blue-900">SIMPLE</p>
                            <p className="text-[10px] font-semibold text-blue-900/80">Sistem Informasi Perlombaan</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold shadow ring-1 ring-white print:hidden">
                        <Link href={back} className="text-blue-800 hover:underline">Penilaian</Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-extrabold text-blue-950">{category ? 'Klasemen Kategori' : 'Klasemen Juara Umum'}</span>
                    </nav>
                </div>

                {!single && (
                    <div className="mx-auto mt-6 max-w-2xl text-center">
                        <Crown className="mx-auto h-12 w-12 text-amber-400 drop-shadow" fill="currentColor" />
                        <div className="relative -mt-2 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-900 px-6 py-3 shadow-xl ring-4 ring-amber-300">
                            <h1 className={`font-black text-white ${category ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'}`} style={{ textShadow: '0 3px 0 rgba(30,58,138,.6)' }}>{heading}</h1>
                        </div>
                        <div className="mx-auto -mt-1 w-[85%] rounded-b-lg bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 px-4 py-1.5 text-sm font-extrabold text-blue-950 shadow">{title}</div>
                    </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 print:hidden">
                    <Link href={self} className={chip(!category)}>Juara umum</Link>
                    {nav.map((n) => (
                        <Link key={`${n.sub_id}-${n.id}`} href={`${self}?sub=${n.sub_id}&kategori=${n.id}`} className={chip(!!category && category.sub_id === n.sub_id && category.id === n.id)}>
                            {n.sub} · {n.name ? n.name : 'Umum'}
                        </Link>
                    ))}
                    {status && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-900 ring-1 ring-amber-300">{status}</span>}
                </div>

                {single ? <Hero s={winners[0]} title={title} /> : pods.length > 0 ? <Podium items={pods} /> : null}

                <div className="relative mt-8 overflow-x-auto rounded-2xl bg-white/90 p-2 shadow-2xl ring-1 ring-white">
                    {category ? (
                        <table className="w-full min-w-[820px] overflow-hidden rounded-xl text-sm">
                            <thead>
                                <tr className={head}>
                                    <th className={`${hd} text-left`}><Trophy className="mr-1.5 inline h-4 w-4 text-amber-300" />Peringkat</th>
                                    <th className={`${hd} text-left`}><Users className="mr-1.5 inline h-4 w-4 text-sky-200" />Peserta</th>
                                    <th className={`${hd} text-left`}>Asal</th>
                                    <th className={`${hd} text-center`}>Juri</th>
                                    <th className={`${hd} text-right`}>Nilai dasar</th>
                                    <th className={`${hd} text-right`}>Potongan</th>
                                    <th className={`${hd} text-right`}>Penalti</th>
                                    <th className={`${hd} text-right`}><Star className="mr-1.5 inline h-4 w-4 text-amber-300" />Nilai akhir</th>
                                    <th className={`${hd} text-left`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category.table.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Belum ada peserta di kategori ini.</td></tr>}
                                {category.table.map((t, i) => (
                                    <tr key={`${t.code}-${i}`} className={`border-b border-white ${rowTint(t.rank)}`}>
                                        <td className="px-4 py-3"><Rank r={t.rank} shared={t.shared} /></td>
                                        <td className="px-4 py-3">
                                            <span className="font-extrabold text-blue-950">{t.code}</span>
                                            {t.name ? <span className="block text-xs text-slate-500">{t.name}</span> : null}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{t.school || '–'}</td>
                                        <td className="px-4 py-3 text-center tabular-nums">{t.judges_done}/{category.need}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{num(t.base)}</td>
                                        <td className={`px-4 py-3 text-right tabular-nums ${t.deduction ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.deduction ? num(t.deduction) : '–'}</td>
                                        <td className={`px-4 py-3 text-right tabular-nums ${t.penalty ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.penalty ? num(t.penalty) : '–'}</td>
                                        <td className="px-4 py-3 text-right text-base font-black tabular-nums text-blue-950">{num(t.score)}{t.provisional ? <span className="ml-1 text-[10px] font-bold text-amber-600">sementara</span> : null}</td>
                                        <td className="px-4 py-3 text-xs font-semibold capitalize text-slate-600">{t.status ?? '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[760px] overflow-hidden rounded-xl text-sm">
                            <thead>
                                <tr className={head}>
                                    <th className={`${hd} text-center`}><Trophy className="mr-1.5 inline h-4 w-4 text-amber-300" />Peringkat</th>
                                    <th className={`${hd} text-left`}><Users className="mr-1.5 inline h-4 w-4 text-sky-200" />Peserta</th>
                                    <th className={`${hd} text-center`}><Star className="mr-1.5 inline h-4 w-4 text-amber-300" />Total Poin</th>
                                    {ov.points.map((_, i) => <th key={i} className={`${hd} text-center`}><Medal className="mr-1.5 inline h-4 w-4 text-amber-200" />Juara {i + 1}</th>)}
                                    <th className={`${hd} text-right`}>Total nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ov.standings.length === 0 && <tr><td colSpan={ov.points.length + 4} className="px-4 py-8 text-center text-slate-400">Belum ada peringkat yang bisa dihitung.</td></tr>}
                                {ov.standings.map((s, i) => (
                                    <tr key={i} className={`border-b border-white ${rowTint(s.rank)}`}>
                                        <td className="px-4 py-3 text-center align-top"><Rank r={s.rank} shared={s.shared} /></td>
                                        <td className="px-4 py-3 align-top">
                                            <p className="text-base font-extrabold text-blue-950">{s.school}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {s.rank <= ov.winner_count && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900">Juara umum {s.rank}</span>}
                                                {s.shared && <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">Juara bersama</span>}
                                                {s.tie && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700">Seri belum terpecahkan</span>}
                                            </div>
                                            {s.why ? <p className="mt-1 max-w-md text-xs leading-snug text-slate-500">{s.why}</p> : null}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top text-xl font-black text-blue-950">{num(s.points)}</td>
                                        {s.counts.map((n, k) => <td key={k} className="px-3 py-3 text-center align-top text-lg font-extrabold text-blue-950">{n}</td>)}
                                        <td className="px-4 py-3 text-right align-top tabular-nums text-slate-600">{num(s.score_total ?? 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!single && !category && (
                    <div className="mt-8 text-center">
                        <p className="text-4xl text-blue-950" style={script}>Selamat kepada para pemenang!</p>
                        <p className="mt-1 text-sm font-semibold text-blue-950">Terus berkarya dan berprestasi di ajang berikutnya.</p>
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-12 rounded-t-[3rem] border-t-4 border-amber-300 bg-gradient-to-b from-blue-700 to-blue-950 px-6 py-6 print:hidden">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                    <Link href={back} className="inline-flex items-center gap-2 rounded-full border-2 border-blue-200 bg-white px-5 py-2.5 text-sm font-extrabold text-blue-900 shadow hover:bg-blue-50">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke penilaian
                    </Link>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border-2 border-blue-200 bg-white px-5 py-2.5 text-sm font-extrabold text-blue-900 shadow hover:bg-blue-50">
                        <Printer className="h-4 w-4" /> Cetak Klasemen
                    </button>
                </div>
            </div>
        </div>
    );
}
