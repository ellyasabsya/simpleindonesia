import { Link } from '@inertiajs/react';
import { ArrowRight, Banknote, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock, Layers, MapPin, ScanLine, Ticket, Users } from 'lucide-react';
import { useState } from 'react';
import { eventMenuIcons } from '@/data/event-menu-icons';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Step = { label: string; done: boolean; href: string };
type Prog = { steps: Step[]; done: number; total: number; next: { label: string; href: string } | null };
type Sum = { total: number; lunas: number; menunggu: number; batal: number; revenue: number; tickets: number; hadir: number };
type SubStat = Sum & { id: number; title: string; method: string | null; quota: number };
type Recent = { at: string | null; name: string; sub: string; kind: 'tiket' | 'formulir'; status: 'lunas' | 'menunggu' | 'batal'; note: string };
type Stats = { isParent: boolean; sum: Sum; subs: SubStat[]; trend: { date: string; n: number; rev: number }[]; recent: Recent[] };
type Item = { key: string; label: string; href: string };

type Props = {
    event: {
        title: string; category: string; location: string; starts_at: string; ends_at: string;
        status: 'pending' | 'published' | 'rejected'; rejection_reason: string | null; package: string; share_percent: number | null;
    };
    cd: { big: string; small: string; live: boolean };
    progress: Record<string, Prog>;
    tracked: Item[];
    rich: Item[];
    overall: number;
    sumDone: number;
    sumTotal: number;
    firstNext: { label: string; next: { label: string; href: string } | null } | undefined;
    stats: Stats | null;
};

const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const day = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const head = 'mb-1.5 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300';

const ST: Record<Recent['status'], { label: string; cls: string }> = {
    lunas: { label: 'Lunas', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    menunggu: { label: 'Menunggu', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-200' },
    batal: { label: 'Batal', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
};

const ago = (iso: string | null) => {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    return Math.floor(s / 86400) + ' hari lalu';
};

/** Dashboard event panel HP (ringkas). Semua data dan tautan sama dengan versi desktop. */
export default function EventDashboardMobile({ event, cd, progress, tracked, rich, overall, sumDone, sumTotal, firstNext, stats }: Props) {
    const [open, setOpen] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(rich.map((m) => [m.key, !!progress[m.key] && progress[m.key].done < progress[m.key].total])),
    );
    const [allRecent, setAllRecent] = useState(false);

    const s = stats?.sum;
    const hadirPct = s && s.tickets > 0 ? Math.round((s.hadir / s.tickets) * 100) : 0;
    const trend = stats?.trend ?? [];
    const maxN = Math.max(1, ...trend.map((t) => t.n));
    const recent = stats ? (allRecent ? stats.recent : stats.recent.slice(0, 4)) : [];

    const cards = s
        ? [
              { label: 'Peserta', value: String(s.total), sub: s.lunas + ' lunas · ' + s.menunggu + ' menunggu', Icon: Users, bar: null as number | null },
              { label: 'Pendapatan', value: rp(s.revenue), sub: 'pembayaran lunas', Icon: Banknote, bar: null },
              { label: 'Kehadiran', value: s.tickets > 0 ? s.hadir + '/' + s.tickets : '-', sub: s.tickets > 0 ? hadirPct + '% check-in' : 'belum ada tiket', Icon: ScanLine, bar: s.tickets > 0 ? hadirPct : null },
              { label: 'Menunggu bayar', value: String(s.menunggu), sub: s.batal > 0 ? s.batal + ' batal' : 'tidak ada batal', Icon: Clock, bar: null },
          ]
        : [];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-500 p-3 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold tracking-[0.18em] text-white/80 uppercase">
                            {event.category} · Paket {event.package}{event.share_percent ? ' (' + event.share_percent + '%)' : ''}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-[17px] leading-tight font-semibold tracking-tight">{event.title}</h2>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-white/15 px-3 py-1.5 text-center">
                        <p className="flex items-center justify-center gap-1.5 text-sm leading-tight font-semibold">
                            {cd.live && <span className="size-2 rounded-full bg-emerald-300" />}
                            {cd.big}
                        </p>
                        <p className="text-[11px] text-white/80">{cd.small}</p>
                    </div>
                </div>
                <div className="mt-2.5 space-y-1 text-xs text-white/85">
                    <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" />{day(event.starts_at)} – {day(event.ends_at)}</p>
                    {event.location && <p className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{event.location}</span></p>}
                </div>
            </section>

            {event.status === 'pending' && (
                <p className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 p-3 text-[13px] font-medium text-amber-800 dark:text-amber-200">
                    <Clock className="size-4 shrink-0" /> Event sedang diperiksa admin. Fitur paket terbuka setelah event tayang.
                </p>
            )}
            {event.status === 'rejected' && (
                <p className="rounded-2xl bg-rose-500/10 p-3 text-[13px] font-medium text-rose-700 dark:text-rose-300">
                    Event ditolak{event.rejection_reason ? ': ' + event.rejection_reason : '.'}
                </p>
            )}

            {tracked.length > 0 && (
                <section className={'space-y-3 rounded-2xl p-3 ' + CARD}>
                    <div>
                        <div className="flex items-center justify-between text-[13px] font-medium">
                            <span>Kesiapan event · {sumDone} dari {sumTotal} langkah</span>
                            <span className="text-indigo-700 dark:text-indigo-300">{overall}%</span>
                        </div>
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                            <span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: overall + '%' }} />
                        </span>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {tracked.map((t) => {
                                const p = progress[t.key];
                                const ok = p.done === p.total;
                                return (
                                    <span key={t.key} className={'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ' + (ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : FIELD + ' ' + MUTED)}>
                                        {t.label} <span className="opacity-70">{p.done}/{p.total}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                    {firstNext?.next ? (
                        <Link href={firstNext.next.href} className={'flex items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-white dark:bg-indigo-500 ' + PRESS}>
                            <span className="min-w-0">
                                <span className="block truncate text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase">Langkah berikutnya · {firstNext.label}</span>
                                <span className="block truncate text-sm font-semibold">{firstNext.next.label}</span>
                            </span>
                            <ArrowRight className="size-4 shrink-0" />
                        </Link>
                    ) : (
                        <p className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="size-4 shrink-0" /> Semua langkah selesai. Event siap berjalan.
                        </p>
                    )}
                </section>
            )}

            {stats && s && (
                <>
                    <section className="grid grid-cols-2 gap-3">
                        {cards.map((c) => (
                            <div key={c.label} className={'rounded-2xl p-3 ' + CARD}>
                                <p className={'flex items-center gap-1.5 text-[11px] ' + MUTED}><c.Icon className="size-3.5" /> {c.label}</p>
                                <p className="mt-1 truncate text-base leading-tight font-semibold">{c.value}</p>
                                <p className={'truncate text-[11px] ' + MUTED}>{c.sub}</p>
                                {c.bar != null && (
                                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                                        <span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: c.bar + '%' }} />
                                    </span>
                                )}
                            </div>
                        ))}
                    </section>

                    <section>
                        <h2 className={head}>Tren pendaftaran · 14 hari</h2>
                        <div className={'rounded-2xl p-3 ' + CARD}>
                            {trend.every((t) => t.n === 0) ? (
                                <p className={'py-6 text-center text-[13px] ' + MUTED}>Belum ada pendaftaran dalam 14 hari terakhir.</p>
                            ) : (
                                <div className="flex h-24 items-end gap-1">
                                    {trend.map((t, i) => (
                                        <div key={t.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5">
                                            <span className="text-[11px] font-semibold">{t.n > 0 ? t.n : ''}</span>
                                            <div className={'w-full rounded-t ' + (t.n > 0 ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-white/10')} style={{ height: t.n > 0 ? Math.max(8, (t.n / maxN) * 100) + '%' : '3px' }} />
                                            <span className={'h-3 text-[11px] whitespace-nowrap ' + MUTED}>{i % 3 === 0 ? t.date : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className={head}>Aktivitas terbaru</h2>
                        {stats.recent.length === 0 ? (
                            <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>Belum ada pendaftaran atau pesanan.</div>
                        ) : (
                            <>
                                <div className={GROUP}>
                                    {recent.map((r, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                                            <span className={'flex size-9 shrink-0 items-center justify-center rounded-full text-indigo-700 dark:text-indigo-300 ' + FIELD}>
                                                {r.kind === 'tiket' ? <Ticket className="size-4" /> : <ClipboardList className="size-4" />}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                                <span className={'block truncate text-[11px] ' + MUTED}>{stats.isParent ? r.sub + ' · ' : ''}{r.note}</span>
                                            </span>
                                            <span className="shrink-0 text-right">
                                                <span className={'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ' + ST[r.status].cls}>{ST[r.status].label}</span>
                                                <span className={'block text-[11px] ' + MUTED}>{ago(r.at)}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {stats.recent.length > 4 && (
                                    <button type="button" onClick={() => setAllRecent((v) => !v)} className="mt-2 w-full text-center text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                        {allRecent ? 'Ringkas' : 'Lihat semua (' + stats.recent.length + ')'}
                                    </button>
                                )}
                            </>
                        )}
                    </section>

                    {stats.isParent && stats.subs.length > 0 && (
                        <section>
                            <h2 className={head}>Sub-event</h2>
                            <div className="space-y-3">
                                {stats.subs.map((c) => {
                                    const ticket = c.method === 'ticket';
                                    const fill = ticket && c.quota > 0 ? Math.min(100, Math.round((c.tickets / c.quota) * 100)) : null;
                                    return (
                                        <div key={c.id} className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500"><Layers className="size-4" /></span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm leading-tight font-semibold">{c.title}</span>
                                                    <span className={'block text-[11px] ' + MUTED}>{ticket ? 'Tiket' : 'Formulir pendaftaran'}</span>
                                                </span>
                                            </div>
                                            <p className="text-[13px]">
                                                <b>{c.lunas}</b> <span className={MUTED}>lunas</span> · <b>{c.menunggu}</b> <span className={MUTED}>menunggu</span> · <b>{c.batal}</b> <span className={MUTED}>batal</span>
                                            </p>
                                            <div className={'flex items-center justify-between rounded-2xl px-3.5 py-2 ' + FIELD}>
                                                <span className="text-[11px] font-semibold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">Pendapatan</span>
                                                <span className="text-sm font-semibold">{rp(c.revenue)}</span>
                                            </div>
                                            {fill !== null && (
                                                <div>
                                                    <div className={'mb-1 flex justify-between text-[11px] ' + MUTED}><span>Kuota terisi</span><span>{c.tickets} / {c.quota} ({fill}%)</span></div>
                                                    <span className="block h-1.5 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                                                        <span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: fill + '%' }} />
                                                    </span>
                                                </div>
                                            )}
                                            <Link href={'/panel/event/' + c.id} className={'flex h-10 items-center justify-center gap-1 rounded-full bg-indigo-600 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}>
                                                Kelola <ChevronRight className="size-4" />
                                            </Link>
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
                    <h2 className={head}>Fitur paket Anda</h2>
                    <div className={GROUP}>
                        {rich.map((m) => {
                            const Icon = eventMenuIcons[m.key] ?? eventMenuIcons.dashboard;
                            const p = progress[m.key];
                            const on = !!open[m.key];
                            const pct = p && p.total ? Math.round((p.done / p.total) * 100) : 0;
                            return (
                                <div key={m.key}>
                                    <div className="flex items-center">
                                        <Link href={m.href} className={'flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-1 pl-3 ' + PRESS}>
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500"><Icon className="size-4" /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm leading-tight font-semibold">{m.label}</span>
                                                {p && (
                                                    <span className="mt-1 flex items-center gap-2">
                                                        <span className="block h-1 flex-1 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                                                            <span className={'block h-full rounded-full ' + (p.done === p.total ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-400')} style={{ width: pct + '%' }} />
                                                        </span>
                                                        <span className={'text-[11px] ' + MUTED}>{p.done}/{p.total}</span>
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                        {p && (
                                            <button type="button" aria-label={on ? 'Tutup langkah' : 'Buka langkah'} aria-expanded={on} onClick={() => setOpen((o) => ({ ...o, [m.key]: !o[m.key] }))} className={'flex size-12 shrink-0 items-center justify-center ' + PRESS}>
                                                <ChevronDown className={'size-4 transition-transform ' + MUTED + (on ? ' rotate-180' : '')} />
                                            </button>
                                        )}
                                    </div>
                                    {p && on && (
                                        <ul className="space-y-0.5 px-2.5 pb-3">
                                            {p.steps.map((st, i) => {
                                                const isNext = !st.done && p.next?.label === st.label;
                                                const badge = st.done ? (
                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="size-3" strokeWidth={3} /></span>
                                                ) : (
                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-[11px] font-semibold text-slate-500 dark:border-white/20 dark:text-slate-300">{i + 1}</span>
                                                );
                                                return st.done ? (
                                                    <li key={st.label} className={'flex items-center gap-2.5 px-2 py-1.5 text-[13px] ' + MUTED}>{badge}{st.label}</li>
                                                ) : (
                                                    <li key={st.label}>
                                                        <Link href={st.href} className={'flex items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] font-medium ' + (isNext ? 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-100' : '') + ' ' + PRESS}>
                                                            {badge}
                                                            <span className="flex-1">{st.label}</span>
                                                            {isNext && <ArrowRight className="size-4" />}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
