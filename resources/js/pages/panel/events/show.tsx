import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Banknote, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, Clock, Layers, MapPin, ScanLine, Ticket, Users } from 'lucide-react';
import { useId } from 'react';
import PanelLayout from '@/components/panel/panel-layout';
import EventDashboardMobile from '@/components/mobile/pages/event-dashboard-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { eventMenuIcons } from '@/data/event-menu-icons';

type Ev = {
    id: number;
    title: string;
    category: string;
    location: string;
    starts_at: string;
    ends_at: string;
    status: 'pending' | 'published' | 'rejected';
    rejection_reason: string | null;
    poster_url: string | null;
    package: string;
    share_percent: number | null;
};
type Nav = { title: string; items: { key: string; label: string; href: string }[] };
type Step = { label: string; done: boolean; href: string };
type Prog = { steps: Step[]; done: number; total: number; next: { label: string; href: string } | null };
type Sum = { total: number; lunas: number; menunggu: number; batal: number; revenue: number; tickets: number; hadir: number };
type SubStat = Sum & { id: number; title: string; method: string | null; quota: number };
type Recent = { at: string | null; name: string; sub: string; kind: 'tiket' | 'formulir'; status: 'lunas' | 'menunggu' | 'batal'; note: string };
type Stats = { isParent: boolean; sum: Sum; subs: SubStat[]; trend: { date: string; n: number; rev: number }[]; recent: Recent[] };

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const card = 'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';

// Warna aksen tiap menu; menu lain memakai warna bawaan.
const ACCENT: Record<string, string> = {
    kalender: 'from-sky-500 to-blue-600 shadow-blue-500/30',
    registrasi: 'from-violet-500 to-purple-600 shadow-violet-500/30',
    tiket: 'from-amber-400 to-orange-500 shadow-orange-500/30',
    voting: 'from-pink-500 to-rose-500 shadow-rose-500/30',
    penilaian: 'from-teal-500 to-emerald-600 shadow-emerald-500/30',
};
const ACCENT_DEFAULT = 'from-blue-600 to-violet-600 shadow-indigo-500/30';

const STATUS: Record<Recent['status'], { label: string; cls: string }> = {
    lunas: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    menunggu: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
    batal: { label: 'Batal', cls: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
};

const ago = (iso: string | null) => {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja';
    if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
    if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
    return `${Math.floor(s / 86400)} hari lalu`;
};

function countdown(start: string, end: string) {
    const day = 86400000;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    const diff = Math.round((s.getTime() - t.getTime()) / day);
    if (diff > 0) return { big: `H-${diff}`, small: 'menuju event', live: false };
    if (t.getTime() <= e.getTime()) {
        const total = Math.round((e.getTime() - s.getTime()) / day) + 1;
        const no = Math.round((t.getTime() - s.getTime()) / day) + 1;
        return { big: 'Berlangsung', small: `Hari ke-${no} dari ${total}`, live: true };
    }
    return { big: 'Selesai', small: 'event telah berakhir', live: false };
}

function Ring({ value, size = 56, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
    const id = useId().replace(/:/g, '');
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const full = value >= 100;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden>
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={full ? '#10b981' : '#2563eb'} />
                        <stop offset="100%" stopColor={full ? '#34d399' : '#7c3aed'} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-white/10" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={`url(#${id})`} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} className="transition-all duration-700"
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center font-extrabold ${size > 80 ? 'text-2xl' : 'text-[13px]'}`}>{value}%</span>
        </div>
    );
}

function Segments({ done, total }: { done: number; total: number }) {
    return (
        <div className="mt-5 flex gap-1.5" role="progressbar" aria-valuenow={done} aria-valuemax={total}>
            {Array.from({ length: total }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < done ? (done === total ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-violet-600') : 'bg-slate-200 dark:bg-white/10'}`} />
            ))}
        </div>
    );
}

function Spark({ data }: { data: number[] }) {
    const w = 100;
    const h = 28;
    const max = Math.max(1, ...data);
    const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - 3 - (v / max) * (h - 8)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-8 w-full" aria-hidden>
            <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

type Sub = { id: number; title: string; method: string | null; fee: number; published: boolean; count: number };

export default function EventDashboard({ event, progress = {}, parent = null, stats = null }: { event: Ev; progress?: Record<string, Prog>; parent?: { id: number; title: string } | null; subs?: Sub[]; stats?: Stats | null }) {
    const { eventNav } = usePage<{ eventNav: Nav }>().props;
    const shortcuts = eventNav.items.filter((i) => i.key !== 'dashboard');
    const rich = shortcuts.filter((i) => progress[i.key]);
    const tracked = shortcuts.filter((s) => progress[s.key]);
    const sumDone = tracked.reduce((a, s) => a + progress[s.key].done, 0);
    const sumTotal = tracked.reduce((a, s) => a + progress[s.key].total, 0);
    const overall = pct(sumDone, sumTotal);
    const firstNext = tracked.map((s) => ({ label: s.label, next: progress[s.key].next })).find((x) => x.next);
    const cd = countdown(event.starts_at, event.ends_at);
    const phone = usePhone();

    const s = stats?.sum;
    const hadirPct = s && s.tickets > 0 ? Math.round((s.hadir / s.tickets) * 100) : 0;
    const trend = stats?.trend ?? [];
    const maxN = Math.max(1, ...trend.map((t) => t.n));
    const statCards = s
        ? [
              { label: 'Total peserta', value: String(s.total), sub: `${s.lunas} lunas · ${s.menunggu} menunggu`, Icon: Users, tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', spark: trend.map((t) => t.n), sparkTone: 'text-indigo-500' },
              { label: 'Pendapatan', value: rp(s.revenue), sub: 'dari pembayaran lunas', Icon: Banknote, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300', spark: trend.map((t) => t.rev), sparkTone: 'text-violet-500' },
              { label: 'Kehadiran', value: s.tickets > 0 ? `${s.hadir}/${s.tickets}` : '-', sub: s.tickets > 0 ? `${hadirPct}% tiket sudah check-in` : 'belum ada tiket terjual', Icon: ScanLine, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300', bar: s.tickets > 0 ? hadirPct : null },
              { label: 'Menunggu bayar', value: String(s.menunggu), sub: s.batal > 0 ? `${s.batal} batal / kedaluwarsa` : 'tidak ada yang batal', Icon: Clock, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
          ]
        : [];

    return (
        <PanelLayout title="Dashboard Event">
            {phone && (
                <EventDashboardMobile
                    event={event}
                    cd={cd}
                    progress={progress}
                    tracked={tracked}
                    rich={rich}
                    overall={overall}
                    sumDone={sumDone}
                    sumTotal={sumTotal}
                    firstNext={firstNext}
                    stats={stats}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-6'}>
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-6">
                    <div className="min-w-0">
                        <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                            {event.category} · Paket {event.package}
                            {event.share_percent ? ` (${event.share_percent}%)` : ''}
                        </span>
                        <h2 className="mt-4 text-2xl font-extrabold">{event.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-blue-50/90">
                            {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>}
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmt(event.starts_at)} – {fmt(event.ends_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-center backdrop-blur">
                            <div className="flex items-center justify-center gap-2 text-2xl font-extrabold leading-none">
                                {cd.live && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" /></span>}
                                {cd.big}
                            </div>
                            <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">{cd.small}</div>
                        </div>
                        {event.poster_url && (
                            <img src={event.poster_url} alt={event.title} className="hidden h-28 w-[90px] rounded-xl object-cover shadow-lg ring-2 ring-white/30 sm:block" />
                        )}
                    </div>
                </div>
            </section>

            {event.status === 'pending' && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <Clock className="h-5 w-5 shrink-0" />
                    Event sedang diperiksa admin. Fitur paket terbuka setelah event tayang.
                </div>
            )}
            {event.status === 'rejected' && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                    Event ditolak{event.rejection_reason ? `: ${event.rejection_reason}` : '.'}
                </div>
            )}

            {tracked.length > 0 && (
                <section className="grid items-stretch gap-5 lg:grid-cols-2">
                    <div className={`${card} flex flex-wrap items-center gap-6`}>
                        <Ring value={overall} size={88} stroke={8} />
                        <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500 uppercase">Kesiapan event</div>
                            <div className="mt-1 text-base font-bold">{sumDone} dari {sumTotal} langkah selesai</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {tracked.map((t) => {
                                    const p = progress[t.key];
                                    const ok = p.done === p.total;
                                    return (
                                        <span key={t.key} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                                            {t.label} <span className="opacity-70">{p.done}/{p.total}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {firstNext?.next ? (
                        <Link href={firstNext.next.href} className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-xl">
                            <span className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/10" />
                            <span className="relative min-w-0">
                                <span className="block text-[11px] font-extrabold tracking-[0.22em] text-blue-100 uppercase">Langkah berikutnya · {firstNext.label}</span>
                                <span className="mt-1.5 block text-base leading-snug font-bold">{firstNext.next.label}</span>
                            </span>
                            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-hover:translate-x-1 group-hover:bg-white/30">
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/25">
                            <CheckCircle2 className="h-8 w-8 shrink-0" />
                            <span><span className="block text-base font-bold">Semua langkah selesai</span><span className="text-sm text-emerald-50">Event Anda siap berjalan.</span></span>
                        </div>
                    )}
                </section>
            )}

            {stats && (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((c) => (
                            <div key={c.label} className={`${card} !p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{c.label}</div>
                                        <div className="mt-2 truncate text-2xl font-extrabold leading-none">{c.value}</div>
                                    </div>
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.tone}`}><c.Icon className="h-5 w-5" /></span>
                                </div>
                                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{c.sub}</div>
                                {c.spark && <div className={c.sparkTone}><Spark data={c.spark} /></div>}
                                {c.bar != null && (
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600" style={{ width: `${c.bar}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>

                    <section className="grid items-stretch gap-5 lg:grid-cols-2">
                        <div className={card}>
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-bold">Tren pendaftaran</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">14 hari terakhir</span>
                            </div>
                            {trend.every((t) => t.n === 0) ? (
                                <p className="py-12 text-center text-sm font-semibold text-slate-500">Belum ada pendaftaran dalam 14 hari terakhir.</p>
                            ) : (
                                <div className="mt-5 flex h-44 items-end gap-1.5 overflow-x-auto">
                                    {trend.map((t) => (
                                        <div key={t.date} className="flex h-full min-w-[30px] flex-1 flex-col items-center justify-end gap-1">
                                            <span className="text-[11px] font-bold">{t.n > 0 ? t.n : ''}</span>
                                            <div className={`w-full rounded-t-lg ${t.n > 0 ? 'bg-gradient-to-t from-indigo-600 to-violet-500' : 'bg-slate-200 dark:bg-white/10'}`} style={{ height: t.n > 0 ? `${Math.max(8, (t.n / maxN) * 100)}%` : '4px' }} />
                                            <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">{t.date}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={card}>
                            <h3 className="text-base font-bold">Aktivitas terbaru</h3>
                            {stats.recent.length === 0 ? (
                                <p className="py-12 text-center text-sm font-semibold text-slate-500">Belum ada pendaftaran atau pesanan.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-slate-100 dark:divide-white/10">
                                    {stats.recent.map((r, i) => (
                                        <li key={i} className="flex items-center gap-3 py-3">
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.kind === 'tiket' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'}`}>
                                                {r.kind === 'tiket' ? <Ticket className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-extrabold">{r.name}</div>
                                                <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{stats.isParent ? `${r.sub} · ` : ''}{r.note}</div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                                                <div className="mt-1 text-[11px] font-semibold text-slate-400">{ago(r.at)}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {stats.isParent && stats.subs.length > 0 && (
                        <section>
                            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sub-event</h3>
                            <div className="grid items-stretch gap-5 lg:grid-cols-2">
                                {stats.subs.map((c) => {
                                    const ticket = c.method === 'ticket';
                                    const fill = ticket && c.quota > 0 ? Math.min(100, Math.round((c.tickets / c.quota) * 100)) : null;
                                    return (
                                        <div key={c.id} className={`${card} flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg`}>
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30"><Layers className="h-5 w-5" /></span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-base font-bold">{c.title}</div>
                                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ticket ? 'Tiket' : 'Formulir pendaftaran'}</div>
                                                </div>
                                            </div>
                                            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                                                {[['Lunas', c.lunas], ['Menunggu', c.menunggu], ['Batal', c.batal]].map(([l, v]) => (
                                                    <div key={String(l)} className="rounded-xl bg-slate-50 py-2.5 dark:bg-white/5"><div className="text-base font-bold">{v}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{l}</div></div>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-2.5 dark:bg-violet-500/10"><span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">Pendapatan</span><span className="text-base font-bold">{rp(c.revenue)}</span></div>
                                            {fill !== null && (
                                                <div className="mt-4 mb-5">
                                                    <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400"><span>Kuota terisi</span><span>{c.tickets} / {c.quota} ({fill}%)</span></div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${fill}%` }} /></div>
                                                </div>
                                            )}
                                            <Link href={`/panel/event/${c.id}`} className="mt-auto inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-800">Kelola<ChevronRight className="h-4 w-4" /></Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}

            {rich.length > 0 && (
                <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Fitur paket Anda</h3>
                    <div className={`grid items-stretch gap-5 ${rich.length > 1 ? 'lg:grid-cols-2' : ''}`}>
                        {rich.map((m) => {
                            const Icon = eventMenuIcons[m.key] ?? eventMenuIcons.dashboard;
                            const p = progress[m.key];
                            const value = p ? pct(p.done, p.total) : 0;
                            const complete = !!p && p.done === p.total;
                            return (
                                <div key={m.key} className={`${card} flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg ${complete ? 'ring-1 ring-emerald-400/40' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <Link href={m.href} className="flex min-w-0 flex-1 items-center gap-4">
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${ACCENT[m.key] ?? ACCENT_DEFAULT}`}>
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-base font-bold">{m.label}</span>
                                                {p && <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{p.done} dari {p.total} langkah</span>}
                                            </span>
                                        </Link>
                                        {p && <Ring value={value} />}
                                    </div>

                                    {p && (
                                        <>
                                            <Segments done={p.done} total={p.total} />
                                            <ul className={`mt-4 ${rich.length === 1 ? 'grid gap-x-4 gap-y-0.5 sm:grid-cols-2' : 'space-y-0.5'}`}>
                                                {p.steps.map((st, i) => {
                                                    const isNext = !st.done && p.next?.label === st.label;
                                                    const badge = st.done ? (
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                                                    ) : (
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-[11px] font-extrabold text-slate-400 dark:border-white/20">{i + 1}</span>
                                                    );
                                                    return st.done ? (
                                                        <li key={st.label} className="flex items-center gap-3 px-2.5 py-2 text-sm text-slate-500 dark:text-slate-400">{badge}{st.label}</li>
                                                    ) : (
                                                        <li key={st.label}>
                                                            <Link href={st.href} className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition ${isNext ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-100' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'}`}>
                                                                {badge}
                                                                <span className="flex-1">{st.label}</span>
                                                                <ArrowRight className={`h-4 w-4 transition group-hover:translate-x-0.5 ${isNext ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
            </div>
        </PanelLayout>
    );
}
