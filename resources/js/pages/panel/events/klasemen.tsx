import { Head, Link, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ChevronDown, ChevronLeft, Copy, MessageCircle, Send, Share2, Star, Trophy, Users, X } from 'lucide-react';
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
    isPublic?: boolean;
    shareUrl?: string;
    shareApi?: string;
    shareReady?: boolean;
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


function ShareButton({ g, onClick, ready }: { g: G; onClick: () => void; ready?: boolean }) {
    return (
        <div className="print:hidden" style={{ ...g.box([420, 26, 700, 72]), zIndex: 30 }}>
            <button
                type="button"
                onClick={onClick}
                title={ready ? 'Bagikan klasemen' : 'Klasemen belum bisa dibagikan'}
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full font-extrabold ring-2 ring-white/80 transition hover:-translate-y-0.5"
                style={{
                    gap: g.cq(10),
                    fontSize: g.cq(18),
                    color: ready ? '#3b1d00' : '#64748b',
                    background: ready ? 'linear-gradient(135deg,#fff3b0 0%,#fbbf24 38%,#d97706 100%)' : 'linear-gradient(135deg,#f1f5f9,#cbd5e1)',
                    boxShadow: ready ? '0 6px 22px rgba(245,158,11,.65), inset 0 1px 0 rgba(255,255,255,.7)' : '0 2px 8px rgba(0,0,0,.15)',
                }}
            >
                {ready && <span style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '40%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent)', transform: 'skewX(-20deg)', animation: 'shine 2.8s ease-in-out infinite' }} />}
                <Share2 style={{ width: g.cq(22), height: g.cq(22), position: 'relative' }} />
                <span style={{ position: 'relative' }}>Bagikan klasemen</span>
            </button>
        </div>
    );
}

function ShareModal({ title, link, api, ready, onClose }: { title: string; link: string; api: string; ready: boolean; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const text = `Klasemen ${title}`;
    const copy = () => {
        navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
    };
    const nativeShare = () => {
        if (typeof navigator.share === 'function') navigator.share({ title: text, url: link }).catch(() => {});
        else copy();
    };
    const sendPeserta = async () => {
        setBusy(true);
        setMsg('');
        try {
            const xsrf = decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
            const r = await fetch(api, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrf } });
            const d = await r.json().catch(() => ({}));
            setMsg(r.ok ? `Terkirim ke ${d.sent ?? 0} dari ${d.total ?? 0} peserta terdaftar.` : (d.message ?? 'Gagal mengirim.'));
        } catch {
            setMsg('Gagal mengirim.');
        }
        setBusy(false);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm md:items-center md:p-4 print:hidden" onClick={onClose}>
            <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl ring-1 ring-amber-200 md:max-h-none md:overflow-hidden md:rounded-3xl md:pb-0" style={{ fontFamily: FONT }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 px-5 py-4">
                    <div className="flex items-center gap-2.5 text-amber-950">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/40 ring-1 ring-white/60"><Share2 className="h-5 w-5" /></span>
                        <div>
                            <p className="text-base font-black leading-tight">Bagikan klasemen</p>
                            <p className="max-w-[16rem] truncate text-xs font-semibold text-amber-950/70">{title}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-amber-950 hover:bg-white/60 md:h-8 md:w-8"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-5 p-5">
                    {!ready && <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">Klasemen baru bisa dibagikan setelah hasil disimpan.</p>}

                    <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-2xl bg-white p-2.5 shadow ring-1 ring-slate-200"><QRCodeSVG value={link} size={104} level="M" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Link publik</p>
                            <p className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{link}</p>
                            <button type="button" onClick={copy} disabled={!ready} className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-extrabold text-white disabled:opacity-40 md:h-auto md:py-1.5">
                                {copied ? <><Check className="h-3.5 w-3.5" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Salin link</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <a
                            href={ready ? `https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            aria-disabled={!ready}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white shadow ${ready ? 'hover:bg-emerald-600' : 'pointer-events-none opacity-40'}`}
                        >
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                        <button type="button" onClick={nativeShare} disabled={!ready} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow hover:bg-indigo-700 disabled:opacity-40">
                            <Share2 className="h-4 w-4" /> Bagikan…
                        </button>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900"><Users className="h-4 w-4" /> Peserta terdaftar</p>
                        <p className="mt-1 text-xs font-semibold text-amber-900/70">Kirim pemberitahuan berisi link klasemen ke semua peserta yang sudah terdaftar di lomba ini.</p>
                        <button type="button" onClick={sendPeserta} disabled={!ready || busy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/30 disabled:opacity-40">
                            <Send className="h-4 w-4" /> {busy ? 'Mengirim…' : 'Kirim ke peserta terdaftar'}
                        </button>
                        {msg && <p className="mt-2 text-center text-xs font-bold text-slate-700">{msg}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

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

function PodiumPage({ title, back, self, ov, category, nav, status, single, isPublic, onShare, shareReady }: Props & { status: string; onShare?: () => void }) {
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
            <Hit g={g} b={[1040, 28, 1170, 70]} href={isPublic ? '/' : '/panel'} label="Beranda" />
            <Hit g={g} b={[1175, 28, 1312, 70]} href={self} label="Klasemen juara umum" />
            <NavMenu g={g} b={[1336, 28, 1632, 70]} self={self} nav={nav} category={category} bare single={single} />
            <StatusPill g={g} b={[1336, 78, 1632, 106]} text={status} />
            {onShare && <ShareButton g={g} onClick={onShare} ready={shareReady} />}

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

            <T g={g} b={[92, 884, 250, 910]} size={14} color="#0f2c78" weight={800} justify="flex-start">{isPublic ? 'Kembali ke beranda' : 'Kembali ke penilaian'}</T>
            <Hit g={g} b={[32, 868, 258, 922]} href={back} label="Kembali ke penilaian" />
            <PrintHit g={g} b={[1430, 868, 1640, 918]} label="Cetak klasemen" />
        </Stage>
    );
}

/* ===================== HALAMAN JUARA UMUM TUNGGAL (jumlah juara umum = 1) ===================== */
function HeroPage({ title, back, self, category, nav, status, s, isPublic, onShare, shareReady }: Props & { status: string; s: Standing; onShare?: () => void }) {
    const g = geo(W, H);
    const sub = title;
    const ss = Math.min(31, 470 / (sub.length * 0.55));
    const pts = num(s.points);
    return (
        <Stage g={g} src="/images/klasemen-hero.jpg">
            <Hit g={g} b={[50, 20, 390, 105]} href="/" label="SIMPLE" />
            <NavMenu g={g} b={[1180, 24, 1632, 68]} self={self} nav={nav} category={category} />
            <StatusPill g={g} b={[1336, 78, 1632, 106]} text={status} />
            {onShare && <ShareButton g={g} onClick={onShare} ready={shareReady} />}

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

            <T g={g} b={[590, 853, 812, 888]} size={19} color="#ffffff" weight={800}>{isPublic ? 'Kembali ke beranda' : 'Kembali ke penilaian'}</T>
            <Hit g={g} b={[500, 835, 820, 903]} href={back} label="Kembali ke penilaian" />
            <PrintHit g={g} b={[852, 835, 1172, 903]} label="Cetak klasemen" />
        </Stage>
    );
}

function MobileKlasemen({ props, status, onShare }: { props: Props; status: string; onShare?: () => void }) {
    const { title, back, self, ov, category, nav, single, isPublic, shareReady } = props;
    const k = Math.min(Math.max(ov.points.length, 1), 5);
    const cur = category ? `${self}?sub=${category.sub_id}&kategori=${category.id}` : self;
    const tone = (r: number | null) => (r === 1 ? 'bg-amber-50 ring-amber-300' : r === 2 ? 'bg-slate-50 ring-slate-300' : r === 3 ? 'bg-orange-50 ring-orange-300' : 'bg-white ring-slate-200');
    const dot = (r: number | null, shared?: boolean) => {
        const bg = r === 1 ? 'bg-amber-500 text-white' : r === 2 ? 'bg-slate-500 text-white' : r === 3 ? 'bg-orange-600 text-white' : 'bg-blue-100 text-blue-900';
        return <span className={'inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2 text-sm font-semibold ' + bg}>{r === null ? '–' : `${r}${shared ? '=' : ''}`}</span>;
    };
    const rows = category ? category.table : [];
    return (
        <div className="min-h-dvh bg-gradient-to-b from-sky-100 to-white px-3 pt-2 pb-28 md:hidden print:hidden" style={{ fontFamily: FONT }}>
            <div className="flex items-center gap-2">
                <Link href={back} aria-label="Kembali" className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-semibold text-blue-950 shadow-sm ring-1 ring-slate-200">
                    <ChevronLeft className="h-4 w-4" /> {isPublic ? 'Beranda' : 'Penilaian'}
                </Link>
                {status && <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-300">{status}</span>}
            </div>
            <h1 className="mt-2 text-xl leading-tight font-semibold text-slate-900">{category ? 'Klasemen Kategori' : 'Juara Umum'}</h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">{category ? `${category.sub} · ${category.name ? `Kategori ${category.name}` : 'Kategori Umum'}` : title}</p>

            <select
                value={cur}
                onChange={(e) => router.visit(e.target.value)}
                aria-label="Tampilan klasemen"
                className="mt-2 h-10 w-full rounded-full border border-slate-300 bg-white px-3 text-base font-semibold text-blue-950"
            >
                {!single && <option value={self}>Juara umum</option>}
                {nav.map((n) => (
                    <option key={`${n.sub_id}-${n.id}`} value={`${self}?sub=${n.sub_id}&kategori=${n.id}`}>{n.sub} · {n.name ? n.name : 'Umum'}</option>
                ))}
            </select>

            {onShare && (
                <button type="button" onClick={onShare} className={'mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold ' + (shareReady ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-500')}>
                    <Share2 className="h-4 w-4" /> Bagikan klasemen
                </button>
            )}

            <div className="mt-2 space-y-1.5">
                {category ? (
                    <>
                        {rows.length === 0 && <p className="py-8 text-center text-[13px] text-slate-600">Belum ada data peringkat.</p>}
                        {rows.map((t, i) => (
                            <div key={`${t.code}-${i}`} className={'rounded-2xl p-2.5 ring-1 ' + tone(t.rank)}>
                                <div className="flex items-start gap-3">
                                    {dot(t.rank, t.shared)}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">{t.code}{t.name ? <span className="font-medium text-slate-500"> · {t.name}</span> : null}</div>
                                        <div className="truncate text-[11px] font-semibold text-slate-600">{t.school || '–'}</div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-base leading-tight font-semibold text-slate-900">{num(t.score)}{t.provisional ? '*' : ''}</div>
                                        <div className="text-[11px] font-semibold text-slate-500 capitalize">{t.status ?? '–'}</div>
                                    </div>
                                </div>
                                <div className="mt-1.5 grid grid-cols-4 gap-1 border-t border-slate-200/70 pt-1.5 text-center">
                                    {([['Juri', `${t.judges_done}/${category.need}`], ['Dasar', num(t.base)], ['Potongan', t.deduction ? num(t.deduction) : '–'], ['Penalti', t.penalty ? num(t.penalty) : '–']] as [string, string][]).map(([l, v]) => (
                                        <div key={l}>
                                            <div className="text-[13px] font-semibold text-slate-800">{v}</div>
                                            <div className="text-[11px] text-slate-500">{l}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {rows.some((t) => t.provisional) && <p className="px-1 text-[11px] font-semibold text-slate-500">* nilai sementara</p>}
                    </>
                ) : (
                    <>
                        {ov.standings.length === 0 && <p className="py-8 text-center text-[13px] text-slate-600">Belum ada data peringkat.</p>}
                        {ov.standings.map((st, i) => (
                            <div key={i} className={'rounded-2xl p-2.5 ring-1 ' + tone(st.rank)}>
                                <div className="flex items-center gap-3">
                                    {dot(st.rank, st.shared)}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate text-sm font-semibold text-slate-900">{st.school}</span>
                                            {st.tie && <span className="shrink-0 text-[11px] font-semibold text-rose-600">seri</span>}
                                        </div>
                                        {st.why && <div className="text-[11px] leading-snug text-slate-500">{st.why}</div>}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-base leading-tight font-semibold text-slate-900">{num(st.points)}</div>
                                        <div className="text-[11px] text-slate-500">poin</div>
                                    </div>
                                </div>
                                <div className="mt-1.5 grid gap-1 border-t border-slate-200/70 pt-1.5 text-center" style={{ gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))` }}>
                                    {st.counts.slice(0, k).map((n, j) => (
                                        <div key={j} className="flex items-baseline justify-center gap-1">
                                            <div className="text-[13px] font-semibold text-slate-800">{n}</div>
                                            <div className="text-[11px] text-slate-500">Juara {j + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

export default function Klasemen(props: Props) {
    const { ov, category } = props;
    const [shareOpen, setShareOpen] = useState(false);
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
            <style>{`html,body{margin:0}@media (min-width:768px){html,body{overflow:hidden}}@keyframes shine{0%{left:-60%}60%,100%{left:150%}}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:landscape;margin:0}}`}</style>
            <div className="hidden md:block print:block">
            {hero ? <HeroPage {...props} status={status} s={winners[0]} onShare={props.isPublic ? undefined : () => setShareOpen(true)} /> : <PodiumPage {...props} status={status} onShare={props.isPublic ? undefined : () => setShareOpen(true)} />}
            </div>
            <MobileKlasemen props={props} status={status} onShare={props.isPublic ? undefined : () => setShareOpen(true)} />
            {shareOpen && !props.isPublic && (
                <ShareModal
                    title={props.title}
                    link={category ? `${props.shareUrl}?sub=${category.sub_id}&kategori=${category.id}` : (props.shareUrl ?? '')}
                    api={props.shareApi ?? ''}
                    ready={!!props.shareReady}
                    onClose={() => setShareOpen(false)}
                />
            )}
        </>
    );
}
