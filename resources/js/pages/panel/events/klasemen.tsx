import { Head, Link } from '@inertiajs/react';
import { ChevronDown, Star, Trophy } from 'lucide-react';
import { type CSSProperties, type ReactNode, useState } from 'react';

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
    single?: boolean;
};
type Box = [number, number, number, number];

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const W = 1672;
const H = 941;

const num = (n: number | string | null | undefined) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 }));
const fit = (len: number, base: number, w: number) => Math.min(base, w / (Math.max(len, 1) * 0.58));

/* Semua koordinat dalam piksel gambar latar (1672 x 941). cq() mengubahnya ke satuan yang ikut mengecil bersama halaman. */
function geo(w: number, h: number) {
    return {
        w,
        h,
        cq: (px: number) => `${((px / w) * 100).toFixed(3)}cqw`,
        box: (b: Box): CSSProperties => ({
            position: 'absolute',
            left: `${(b[0] / w) * 100}%`,
            top: `${(b[1] / h) * 100}%`,
            width: `${((b[2] - b[0]) / w) * 100}%`,
            height: `${((b[3] - b[1]) / h) * 100}%`,
        }),
    };
}
type G = ReturnType<typeof geo>;

function Stage({ g, src, children }: { g: G; src: string; children: ReactNode }) {
    return (
        <div className="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-sky-200">
            <div className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${src})` }} />
            <div
                className="relative shadow-2xl"
                style={{ width: `min(100vw, calc(100dvh * ${g.w} / ${g.h}))`, aspectRatio: `${g.w} / ${g.h}`, containerType: 'inline-size', fontFamily: FONT }}
            >
                <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
                {children}
            </div>
        </div>
    );
}

function T({ g, b, size, color, weight = 700, justify = 'center', font = FONT, shadow, children }: { g: G; b: Box; size: number; color: string; weight?: number; justify?: 'center' | 'flex-start'; font?: string; shadow?: string; children: ReactNode }) {
    return (
        <div style={{ ...g.box(b), display: 'flex', alignItems: 'center', justifyContent: justify, textAlign: justify === 'center' ? 'center' : 'left', fontFamily: font, fontWeight: weight, fontSize: g.cq(size), lineHeight: 1.06, color, textShadow: shadow, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
        </div>
    );
}

function GoldText({ g, b, size, children }: { g: G; b: Box; size: number; children: ReactNode }) {
    return (
        <div style={{ ...g.box(b), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
                style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: g.cq(size),
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    backgroundImage: 'linear-gradient(180deg,#fff6bf 0%,#ffd84d 48%,#e39a00 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0.07em 0 rgba(110,55,0,.6))',
                }}
            >
                {children}
            </span>
        </div>
    );
}

function Hit({ g, b, href, label }: { g: G; b: Box; href: string; label: string }) {
    return <Link href={href} aria-label={label} className="print:hidden" style={{ ...g.box(b), zIndex: 20, borderRadius: g.cq(30) }} />;
}

function PrintHit({ g, b, label }: { g: G; b: Box; label: string }) {
    return <button type="button" aria-label={label} onClick={() => window.print()} className="print:hidden" style={{ ...g.box(b), zIndex: 20, borderRadius: g.cq(30) }} />;
}

function NavMenu({ g, b, self, nav, category, bare, single }: { g: G; b: Box; self: string; nav: Nav[]; category: Cat | null; bare?: boolean; single?: boolean }) {
    const [open, setOpen] = useState(false);
    const label = category ? `${category.sub} · ${category.name || 'Umum'}` : 'Juara umum';
    const item = (on: boolean): CSSProperties => ({ display: 'block', padding: `${g.cq(8)} ${g.cq(16)}`, fontSize: g.cq(16), fontWeight: on ? 800 : 600, color: on ? '#1d4ed8' : '#0f2c78', background: on ? '#eaf1ff' : 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    return (
        <div className="print:hidden" style={{ ...g.box(b), zIndex: 30 }}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex h-full w-full items-center justify-between rounded-full font-bold text-blue-950 ${bare ? 'bg-transparent' : 'bg-white/85 shadow ring-1 ring-white/80 backdrop-blur'}`}
                style={{ padding: `0 ${g.cq(22)}`, fontSize: g.cq(16) }}
            >
                <span className="truncate">Tampilan: {label}</span>
                <ChevronDown style={{ width: g.cq(20), height: g.cq(20), flexShrink: 0 }} />
            </button>
            {open && (
                <div className="bg-white/95 shadow-xl ring-1 ring-blue-100" style={{ position: 'absolute', top: '112%', left: 0, right: 0, maxHeight: g.cq(320), overflowY: 'auto', borderRadius: g.cq(16), padding: `${g.cq(4)} 0` }}>
                    {!single && <Link href={self} style={item(!category)}>Juara umum</Link>}
                    {nav.map((n) => (
                        <Link key={`${n.sub_id}-${n.id}`} href={`${self}?sub=${n.sub_id}&kategori=${n.id}`} style={item(!!category && category.sub_id === n.sub_id && category.id === n.id)}>
                            {n.sub} · {n.name ? n.name : 'Umum'}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusPill({ g, b, text }: { g: G; b: Box; text: string }) {
    if (!text) return null;
    return (
        <div style={{ ...g.box(b), display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span className="rounded-full bg-amber-100 font-extrabold text-amber-900 ring-1 ring-amber-300" style={{ fontSize: g.cq(14), padding: `${g.cq(3)} ${g.cq(14)}` }}>{text}</span>
        </div>
    );
}

function RankDot({ g, r, shared, size }: { g: G; r: number | null; shared?: boolean; size: number }) {
    if (r === null) return <span style={{ color: '#94a3b8' }}>–</span>;
    const bg = r === 1 ? 'linear-gradient(145deg,#fde68a,#d97706)' : r === 2 ? 'linear-gradient(145deg,#e2e8f0,#64748b)' : r === 3 ? 'linear-gradient(145deg,#fdba74,#c2410c)' : '#dbe7ff';
    return (
        <span style={{ minWidth: g.cq(size), height: g.cq(size), padding: `0 ${g.cq(size * 0.2)}`, borderRadius: g.cq(size), background: bg, color: r <= 3 ? '#fff' : '#1e3a8a', fontWeight: 900, fontSize: g.cq(size * 0.52), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px rgba(255,255,255,.85)' }}>
            {r}
            {shared ? '=' : ''}
        </span>
    );
}

const tint = (r: number | null) => (r === 1 ? '#fbe9b4' : r === 2 ? '#edf1fa' : r === 3 ? '#fbe8de' : '#f7f9fd');

/* ===================== HALAMAN PODIUM (juara umum 2+ pemenang & per kategori) ===================== */
type Pod = { name: string; value: string; line: string };
const SLOT: { name: Box; nw: number; nc: string; box: Box; ns: number; ps: number; ls: number }[] = [
    { name: [722, 370, 948, 416], nw: 226, nc: '#111827', box: [684, 440, 988, 516], ns: 32, ps: 34, ls: 17 },
    { name: [300, 404, 486, 442], nw: 186, nc: '#17294f', box: [268, 460, 522, 522], ns: 27, ps: 28, ls: 14.5 },
    { name: [1190, 420, 1380, 462], nw: 190, nc: '#3b1d0e', box: [1160, 474, 1402, 528], ns: 27, ps: 28, ls: 14.5 },
];

function PodCard({ g, b, value, line, ps, ls }: { g: G; b: Box; value: string; line: string; ps: number; ls: number }) {
    const w = b[2] - b[0];
    const f1 = fit(value.length, ps, w - 70);
    const f2 = fit(line.length, ls, w - 56);
    return (
        <div style={{ ...g.box(b), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: g.cq(3), color: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: g.cq(8), fontWeight: 800, fontSize: g.cq(f1), lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                <Star style={{ width: g.cq(f1 * 0.95), height: g.cq(f1 * 0.95), color: '#f59e0b', fill: '#fbbf24', flexShrink: 0 }} />
                <span>{value}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: g.cq(6), fontWeight: 700, fontSize: g.cq(f2), lineHeight: 1.1, color: '#e8eefc', whiteSpace: 'nowrap' }}>
                <Trophy style={{ width: g.cq(f2 * 1.1), height: g.cq(f2 * 1.1), color: '#fbbf24', flexShrink: 0 }} />
                <span>{line}</span>
            </div>
        </div>
    );
}

function PodiumPage({ title, back, self, ov, category, nav, status, single }: Props & { status: string }) {
    const g = geo(W, H);
    const pods: Pod[] = category
        ? category.table
              .filter((t) => t.rank !== null)
              .slice(0, 3)
              .map((t) => ({ name: t.name || t.code, value: `${num(t.score)} nilai`, line: t.school || t.code }))
        : ov.standings.slice(0, 3).map((s) => ({ name: s.school, value: `${num(s.points)} Poin`, line: s.counts.slice(0, 3).map((c, i) => `${c} Juara ${i + 1}`).join(' • ') }));

    const titleText = category ? 'Klasemen Kategori' : 'Juara Umum';
    const subText = category ? `${category.sub} · ${category.name ? `Kategori ${category.name}` : 'Kategori Umum'}` : title;
    const ts = fit(titleText.length, 74, 440);
    const ss = Math.min(27, 400 / (subText.length * 0.56));

    const k = Math.min(Math.max(ov.points.length, 1), 5);
    const tplS = `15.8% 23.5% 16.4% repeat(${k}, 1fr)`;
    const tplC = '9% 22% 15% 7% 10% 10% 9% 10% 8%';
    const ROW = 40;
    const cell = (al: string, first = false): CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: al, padding: `0 ${g.cq(10)}`, minWidth: 0, height: '100%', borderLeft: first ? 'none' : '1px solid #d6deec' });
    const rowStyle = (tpl: string, bg: string, fs: number): CSSProperties => ({ height: g.cq(ROW), display: 'grid', gridTemplateColumns: tpl, alignItems: 'center', background: bg, borderBottom: '1px solid #d6deec', fontSize: g.cq(fs), color: '#111827', fontWeight: 700 });

    const headS = ['Peringkat', 'Kontingen', 'Total Poin', ...ov.points.slice(0, k).map((_, i) => `Juara ${i + 1}`)];
    const headC = ['Peringkat', 'Peserta', 'Asal', 'Juri', 'Dasar', 'Potongan', 'Penalti', 'Akhir', 'Status'];
    const alC = ['center', 'flex-start', 'flex-start', 'center', 'flex-end', 'flex-end', 'flex-end', 'flex-end', 'flex-start'];
    const heads = category ? headC : headS;

    return (
        <Stage g={g} src="/images/klasemen-podium.jpg">
            <Hit g={g} b={[40, 10, 350, 95]} href="/" label="SIMPLE" />
            <Hit g={g} b={[1040, 28, 1170, 70]} href="/panel" label="Beranda" />
            <Hit g={g} b={[1175, 28, 1312, 70]} href={self} label="Klasemen juara umum" />
            <NavMenu g={g} b={[1336, 28, 1632, 70]} self={self} nav={nav} category={category} bare single={single} />
            <StatusPill g={g} b={[1336, 78, 1632, 106]} text={status} />

            <GoldText g={g} b={[600, 98, 1072, 168]} size={ts}>{titleText}</GoldText>

            <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                    <path id="sp" d="M 636 201 Q 836 180 1036 203" />
                </defs>
                <text fontFamily={FONT} fontWeight={800} fontSize={ss} fill="#111827" dominantBaseline="central">
                    <textPath href="#sp" startOffset="50%" textAnchor="middle">{subText}</textPath>
                </text>
            </svg>

            {SLOT.map((s, i) => {
                const p = pods[i];
                if (!p) return null;
                return (
                    <div key={i}>
                        <T g={g} b={s.name} size={fit(p.name.length, s.ns, s.nw)} color={s.nc} weight={800}>{p.name}</T>
                        <PodCard g={g} b={s.box} value={p.value} line={p.line} ps={s.ps} ls={s.ls} />
                    </div>
                );
            })}

            <div style={{ ...g.box([172, 647, 1500, 806]), display: 'flex', flexDirection: 'column', border: '1px solid #cfd8ea', background: '#f7f9fd' }}>
                <div style={{ height: g.cq(39), flexShrink: 0, display: 'grid', gridTemplateColumns: category ? tplC : tplS, alignItems: 'center', background: '#eaf1fb', color: '#1f2a44', fontWeight: 800, fontSize: g.cq(category ? 16 : 19), borderBottom: '1px solid #d6deec' }}>
                    {heads.map((h, i) => (
                        <div key={i} style={{ ...cell(category ? alC[i] : 'center', i === 0), height: '100%' }}>
                            <span className="truncate">{h}</span>
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                    {(category ? category.table.length === 0 : ov.standings.length === 0) && (
                        <div style={{ padding: g.cq(22), textAlign: 'center', fontSize: g.cq(18), color: '#94a3b8', fontWeight: 600 }}>Belum ada data peringkat.</div>
                    )}
                    {category
                        ? category.table.map((t, i) => (
                              <div key={`${t.code}-${i}`} style={rowStyle(tplC, tint(t.rank), 16.5)}>
                                  <div style={cell('center', true)}><RankDot g={g} r={t.rank} shared={t.shared} size={30} /></div>
                                  <div style={cell('flex-start')}><span className="truncate font-extrabold">{t.code}{t.name ? <span style={{ fontWeight: 500, color: '#64748b' }}> · {t.name}</span> : null}</span></div>
                                  <div style={cell('flex-start')}><span className="truncate font-medium">{t.school || '–'}</span></div>
                                  <div style={cell('center')}>{t.judges_done}/{category.need}</div>
                                  <div style={cell('flex-end')}>{num(t.base)}</div>
                                  <div style={{ ...cell('flex-end'), color: t.deduction ? '#dc2626' : '#94a3b8' }}>{t.deduction ? num(t.deduction) : '–'}</div>
                                  <div style={{ ...cell('flex-end'), color: t.penalty ? '#dc2626' : '#94a3b8' }}>{t.penalty ? num(t.penalty) : '–'}</div>
                                  <div style={{ ...cell('flex-end'), fontWeight: 900, fontSize: g.cq(19) }}>{num(t.score)}{t.provisional ? '*' : ''}</div>
                                  <div style={cell('flex-start')}><span className="truncate font-medium capitalize">{t.status ?? '–'}</span></div>
                              </div>
                          ))
                        : ov.standings.map((s, i) => (
                              <div key={i} style={rowStyle(tplS, tint(s.rank), 21)}>
                                  <div style={cell('center', true)}><RankDot g={g} r={s.rank} shared={s.shared} size={30} /></div>
                                  <div style={cell('center')}>
                                      <span className="truncate font-extrabold">{s.school}</span>
                                      {s.tie ? <span style={{ marginLeft: g.cq(8), fontSize: g.cq(12), fontWeight: 800, color: '#dc2626' }}>seri</span> : null}
                                  </div>
                                  <div style={{ ...cell('center'), fontWeight: 900 }}>{num(s.points)}</div>
                                  {s.counts.slice(0, k).map((n, j) => <div key={j} style={cell('center')}>{n}</div>)}
                              </div>
                          ))}
                </div>
            </div>

            <T g={g} b={[92, 884, 250, 910]} size={14} color="#0f2c78" weight={800} justify="flex-start">Kembali ke penilaian</T>
            <Hit g={g} b={[32, 868, 258, 922]} href={back} label="Kembali ke penilaian" />
            <PrintHit g={g} b={[1430, 868, 1640, 918]} label="Cetak klasemen" />
        </Stage>
    );
}

/* ===================== HALAMAN JUARA UMUM TUNGGAL (jumlah juara umum = 1) ===================== */
function HeroPage({ title, back, self, category, nav, status, s }: Props & { status: string; s: Standing }) {
    const g = geo(W, H);
    const sub = title;
    const ss = Math.min(31, 470 / (sub.length * 0.55));
    const pts = num(s.points);
    return (
        <Stage g={g} src="/images/klasemen-hero.jpg">
            <Hit g={g} b={[50, 20, 390, 105]} href="/" label="SIMPLE" />
            <NavMenu g={g} b={[1180, 24, 1632, 68]} self={self} nav={nav} category={category} />
            <StatusPill g={g} b={[1336, 78, 1632, 106]} text={status} />

            <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                    <path id="hp" d="M 600 243 Q 833 216 1068 246" />
                </defs>
                <text fontFamily={FONT} fontWeight={800} fontSize={ss} fill="#111827" dominantBaseline="central">
                    <textPath href="#hp" startOffset="50%" textAnchor="middle">{sub}</textPath>
                </text>
            </svg>

            <T g={g} b={[690, 583, 970, 636]} size={fit(s.school.length, 50, 270)} color="#111827" weight={800}>{s.school}</T>
            <T g={g} b={[770, 716, 898, 800]} size={fit(pts.length, 88, 150)} color="#ffffff" weight={900} shadow="0 3px 6px rgba(90,50,0,.55)">{pts}</T>

            {[455, 520, 587].map((cy, i) => (
                <T key={i} g={g} b={[1498, cy - 30, 1566, cy + 30]} size={46} color="#1f2937" weight={800}>{s.counts[i] ?? 0}</T>
            ))}

            <T g={g} b={[590, 853, 812, 888]} size={19} color="#ffffff" weight={800}>Kembali ke penilaian</T>
            <Hit g={g} b={[500, 835, 820, 903]} href={back} label="Kembali ke penilaian" />
            <PrintHit g={g} b={[852, 835, 1172, 903]} label="Cetak klasemen" />
        </Stage>
    );
}

export default function Klasemen(props: Props) {
    const { ov, category } = props;
    const winners = ov.standings.filter((s) => s.rank <= ov.winner_count);
    const status = category
        ? category.locked ? 'Ditetapkan' : category.saved ? 'Tersimpan' : 'Belum disimpan'
        : ov.locked ? 'Ditetapkan' : ov.saved ? `Tersimpan · ${ov.saved_at ?? ''}` : ov.provisional ? 'Sementara' : '';
    const hero = !category && ov.winner_count === 1 && winners.length === 1;
    return (
        <>
            <Head title={`Klasemen - ${props.title}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>
            <style>{`html,body{margin:0;overflow:hidden}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:landscape;margin:0}}`}</style>
            {hero ? <HeroPage {...props} status={status} s={winners[0]} /> : <PodiumPage {...props} status={status} />}
        </>
    );
}
