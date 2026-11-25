import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Pencil, Plus, ShieldCheck, Trash2, UserPlus, Wallet } from 'lucide-react';
import { useState } from 'react';
import ListRow from '../kit/list-row';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type St = 'pending' | 'published' | 'rejected';
type Ev = { id: number; title: string; category: string; package: string; starts_at: string; ends_at: string; status: St; poster_url?: string | null };
type Mem = { id: number; name: string | null; email: string | null; role: string; permissions: string[]; is_owner?: boolean; status?: string };

type Props = {
    institution: { name: string };
    verified: boolean;
    isOwner: boolean;
    canEvents: boolean;
    canFinance: boolean;
    canWithdraw: boolean;
    counts: { total: number; published: number; pending: number; rejected: number };
    attention: number;
    balance: { available: number; processing: number; withdrawn: number };
    events: Ev[];
    pagination: { current: number; last: number; total: number; per_page: number };
    filter: string | null;
    upcoming: { title: string; starts_at: string } | null;
    checklist: { label: string; done: boolean }[];
    percent: number;
    team: Mem[];
    roleLabel: (role: string) => string;
    go: (p: { status?: string | null; page?: number }) => void;
    onAdd: () => void;
    onEdit: (m: Mem) => void;
    onRemove: (m: Mem) => void;
};

const STATUS: Record<St, { label: string; dot: string }> = {
    published: { label: 'Tayang', dot: 'bg-emerald-400' },
    pending: { label: 'Diproses', dot: 'bg-amber-400' },
    rejected: { label: 'Ditolak', dot: 'bg-rose-500' },
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n || 0);
const tgl = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const head = 'mb-1.5 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300';
const TEAM_SHOW = 3;

const chip = (active: boolean) =>
    'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium ' + PRESS + ' ' +
    (active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : CARD + ' text-slate-800 dark:text-slate-100');

/** Dashboard panel lembaga HP (ringkas): ringkasan, kelengkapan, saldo, event, anggota. */
export default function PanelDashboardMobile(p: Props) {
    const { counts, balance, pagination: pg } = p;
    const [openCheck, setOpenCheck] = useState(p.percent < 100);
    const [allTeam, setAllTeam] = useState(false);

    const stats: [string, number, boolean][] = [
        ['Event', counts.total, false],
        ['Tayang', counts.published, false],
        ['Tindakan', p.attention, p.attention > 0],
        ['Tim', p.team.length, false],
    ];
    const tabs: { k: string | null; label: string; n: number }[] = [
        { k: null, label: 'Semua', n: counts.total },
        { k: 'published', label: 'Tayang', n: counts.published },
        { k: 'pending', label: 'Diproses', n: counts.pending },
        { k: 'rejected', label: 'Ditolak', n: counts.rejected },
    ];
    const team = allTeam ? p.team : p.team.slice(0, TEAM_SHOW);

    return (
        <div className="space-y-3 pb-24">
            <header className="space-y-2.5 px-1">
                <div className="flex items-center gap-2">
                    <h1 className="min-w-0 truncate text-[17px] leading-tight font-semibold tracking-tight">{p.institution.name}</h1>
                    {p.verified && <ShieldCheck aria-label="Terverifikasi" className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="flex gap-2">
                    {p.canEvents && (
                        <Link href="/panel/ajukan" className={'flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}>
                            <Plus className="size-4" /> Buat event
                        </Link>
                    )}
                    <Link href="/panel/profil" className={'flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-indigo-700 dark:text-indigo-300 ' + FIELD + ' ' + PRESS}>
                        Ubah profil
                    </Link>
                </div>
            </header>

            <section className="space-y-2">
                <div className={'grid grid-cols-4 divide-x divide-slate-900/[0.07] rounded-2xl py-3 dark:divide-white/10 ' + CARD}>
                    {stats.map(([label, n, warn]) => (
                        <div key={label} className="text-center">
                            <p className={'text-base leading-tight font-semibold ' + (warn ? 'text-amber-700 dark:text-amber-300' : '')}>{n}</p>
                            <p className={'text-[11px] ' + MUTED}>{label}</p>
                        </div>
                    ))}
                </div>
                {p.upcoming && (
                    <div className={'flex items-center gap-2.5 rounded-2xl px-3 py-2 ' + CARD}>
                        <CalendarDays className="size-4 shrink-0 text-indigo-700 dark:text-indigo-300" />
                        <p className="min-w-0 flex-1 truncate text-[13px]">
                            <span className={MUTED}>Terdekat · {tgl(p.upcoming.starts_at)} · </span>
                            <span className="font-semibold">{p.upcoming.title}</span>
                        </p>
                    </div>
                )}
            </section>

            <section className={'overflow-hidden rounded-2xl ' + CARD}>
                <button type="button" aria-expanded={openCheck} onClick={() => setOpenCheck((v) => !v)} className={'flex w-full items-center gap-3 px-4 py-3 text-left ' + PRESS}>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between text-[13px] font-medium">
                            <span>Kelengkapan lembaga</span>
                            <span className="text-indigo-700 dark:text-indigo-300">{p.percent}%</span>
                        </span>
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                            <span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: p.percent + '%' }} />
                        </span>
                    </span>
                    <ChevronDown className={'size-4 shrink-0 transition-transform ' + MUTED + (openCheck ? ' rotate-180' : '')} />
                </button>
                {openCheck && (
                    <ul className="space-y-2 px-4 pb-3.5">
                        {p.checklist.map((c) => (
                            <li key={c.label} className="flex items-center gap-2.5 text-[13px]">
                                <span className={'flex size-4 shrink-0 items-center justify-center rounded-full ' + (c.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 dark:border-white/20')}>
                                    {c.done && <Check className="size-2.5" strokeWidth={3.5} />}
                                </span>
                                <span className={c.done ? MUTED : 'font-medium'}>{c.label}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {(p.canFinance || p.canWithdraw) && (
                <section className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-500 p-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-xs text-white/80"><Wallet className="size-3.5" /> Saldo tersedia</p>
                            <p className="truncate text-[22px] leading-tight font-semibold">{rp(balance.available)}</p>
                        </div>
                        {p.canWithdraw && (
                            <Link href="/panel/pendapatan" className={'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-indigo-700 ' + PRESS}>
                                Tarik <ArrowRight className="size-4" />
                            </Link>
                        )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/75">
                        <span>Diproses {rp(balance.processing)} · Ditarik {rp(balance.withdrawn)}</span>
                        {p.canFinance && <Link href="/panel/pendapatan" className="shrink-0 font-medium text-white underline">Pendapatan</Link>}
                    </div>
                </section>
            )}

            <section id="event" className="scroll-mt-20">
                <h2 className={head}>Event lembaga</h2>
                {counts.total > 0 && (
                    <div className="-mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
                        {tabs.map((t) => (
                            <button key={t.label} type="button" onClick={() => p.go({ status: t.k })} className={chip(p.filter === t.k)}>
                                {t.label} <span className="opacity-70">{t.n}</span>
                            </button>
                        ))}
                    </div>
                )}
                {p.events.length === 0 ? (
                    <div className={'rounded-2xl px-4 py-8 text-center text-sm ' + FIELD + ' ' + MUTED}>
                        {counts.total > 0 ? 'Tidak ada event dengan status ini.' : 'Belum ada event. Ajukan event pertama Anda.'}
                    </div>
                ) : (
                    <div className={GROUP}>
                        {p.events.map((e) => (
                            <ListRow
                                key={e.id}
                                href={'/panel/event/' + e.id}
                                image={e.poster_url}
                                tall
                                fallback={<CalendarDays className="size-6" strokeWidth={1.5} />}
                                eyebrow={
                                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                        <span className={'size-1.5 rounded-full ' + STATUS[e.status].dot} />
                                        {STATUS[e.status].label}
                                    </span>
                                }
                                title={e.title}
                                lines={[tgl(e.starts_at) + (e.ends_at !== e.starts_at ? ' – ' + tgl(e.ends_at) : ''), 'Paket ' + e.package]}
                            />
                        ))}
                    </div>
                )}
                {pg.last > 1 && (
                    <nav className="mt-2.5 flex items-center justify-between gap-3">
                        <button type="button" disabled={pg.current <= 1} onClick={() => p.go({ page: pg.current - 1 })} className={'h-10 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 ' + CARD}>Sebelumnya</button>
                        <span className={'text-xs ' + MUTED}>{pg.current} / {pg.last}</span>
                        <button type="button" disabled={pg.current >= pg.last} onClick={() => p.go({ page: pg.current + 1 })} className={'h-10 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 ' + CARD}>Berikutnya</button>
                    </nav>
                )}
            </section>

            <section id="anggota" className="scroll-mt-20">
                <div className="mb-1.5 flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Anggota tim</h2>
                    {p.isOwner && (
                        <button type="button" onClick={p.onAdd} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            <UserPlus className="size-3.5" /> Tambah
                        </button>
                    )}
                </div>
                <div className={GROUP}>
                    {team.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[13px] font-semibold text-white dark:bg-indigo-500">
                                {(m.name ?? m.email ?? '?').trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm leading-tight font-semibold">{m.name ?? m.email}</span>
                                <span className={'block truncate text-[11px] ' + MUTED}>
                                    {m.is_owner ? 'Pemilik · Semua akses' : p.roleLabel(m.role) + ' · ' + m.permissions.length + ' akses'}
                                    {m.status === 'menunggu' ? ' · Menunggu persetujuan' : ''}
                                </span>
                            </span>
                            {p.isOwner && !m.is_owner && (
                                <span className="flex gap-1">
                                    <button type="button" onClick={() => p.onEdit(m)} aria-label="Ubah akses" className={'flex size-8 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 ' + FIELD}><Pencil className="size-3.5" /></button>
                                    <button type="button" onClick={() => p.onRemove(m)} aria-label="Keluarkan" className={'flex size-8 items-center justify-center rounded-full text-rose-600 dark:text-rose-400 ' + FIELD}><Trash2 className="size-3.5" /></button>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                {p.team.length > TEAM_SHOW && (
                    <button type="button" onClick={() => setAllTeam((v) => !v)} className="mt-2 w-full text-center text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {allTeam ? 'Ringkas' : 'Lihat semua (' + p.team.length + ')'}
                    </button>
                )}
            </section>
        </div>
    );
}
