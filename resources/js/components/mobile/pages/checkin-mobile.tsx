import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Row = { code: string; reg_id: string | null; name: string; type: string | null; buyer: string | null; at: string | null; sub?: string | null; kind?: string; also?: boolean };
type Tab = 'semua' | 'hadir' | 'belum';

type Props = {
    scanner: ReactNode;
    hadir: number;
    hadirHariIni?: number;
    total: number;
    pct: number;
    tab: Tab;
    setTab: (t: Tab) => void;
    q: string;
    setQ: (v: string) => void;
    type: string;
    setType: (v: string) => void;
    types: string[];
    sub: string;
    setSub: (v: string) => void;
    subs: string[];
    subStat: Record<string, { t: number; h: number }>;
    allHadir: number;
    allTotal: number;
    view: Row[];
    count: number;
    busy: string;
    err: string;
    onCheckin: (r: Row) => void;
    cur: number;
    pages: number;
    setPage: (n: number) => void;
    showKind: boolean;
    kind: string;
    setKind: (v: '' | 'pengunjung' | 'peserta') => void;
    kindStat: Record<'pengunjung' | 'peserta', { t: number; h: number }>;
};

const chip = (active: boolean) =>
    'inline-flex h-10 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium ' + PRESS + ' ' +
    (active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : CARD + ' text-slate-800 dark:text-slate-100');

const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;
const pgBtn = 'inline-flex size-8 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30 dark:text-slate-300';
const pgNum = (on: boolean) => 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ' + (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'text-slate-700 dark:text-slate-200');

/** Check-in HP (ringkas): pemindai, satu kartu statistik + cari + filter, daftar rapat. */
export default function CheckinMobile(p: Props) {
    const tabs: [Tab, string][] = [['semua', 'Semua'], ['hadir', 'Hadir'], ['belum', 'Belum']];
    const twoSel = p.types.length > 1 && p.subs.length > 0;
    const nums = Array.from({ length: Math.min(3, p.pages) }, (_, k) => Math.max(1, Math.min(p.cur - 1, p.pages - 2)) + k);

    return (
        <div className="space-y-3 pb-28">
            <section className={'rounded-2xl p-3 ' + CARD}>{p.scanner}</section>

            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-base font-semibold">
                            {p.hadir}<span className={'text-xs font-normal ' + MUTED}> / {p.total} hadir ({p.pct}%)</span>
                        </p>
                        <p className={'text-[11px] ' + MUTED}>Belum {p.total - p.hadir}{p.hadirHariIni !== undefined ? ' · Hari ini ' + p.hadirHariIni : ''}</p>
                    </div>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                        <span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: p.pct + '%' }} />
                    </span>
                </div>

                <label className={'flex h-10 items-center gap-2 rounded-xl px-3 ' + FIELD}>
                    <Search className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                    <input type="search" value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder="Cari ID, nama, pembeli, kode" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
                </label>

                <div className="flex gap-1.5">
                    {tabs.map(([k, l]) => <button key={k} type="button" onClick={() => p.setTab(k)} className={chip(p.tab === k)}>{l}</button>)}
                </div>

                {p.showKind && (
                    <div className="flex gap-1.5">
                        {([['', 'Semua'], ['pengunjung', 'Pengunjung'], ['peserta', 'Peserta']] as const).map(([k, l]) => (
                            <button key={k} type="button" onClick={() => p.setKind(k)} className={chip(p.kind === k)}>{l}{k ? ' ' + p.kindStat[k].h + '/' + p.kindStat[k].t : ''}</button>
                        ))}
                    </div>
                )}

                {(p.types.length > 1 || p.subs.length > 0) && (
                    <div className={'grid gap-2 ' + (twoSel ? 'grid-cols-2' : 'grid-cols-1')}>
                        {p.types.length > 1 && (
                            <select value={p.type} onChange={(e) => p.setType(e.target.value)} className={sel}>
                                <option value="">Semua jenis</option>
                                {p.types.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                        {p.subs.length > 0 && (
                            <select value={p.sub} onChange={(e) => p.setSub(e.target.value)} className={sel}>
                                <option value="">Semua · {p.allHadir}/{p.allTotal}</option>
                                {p.subs.map((s) => <option key={s} value={s}>{s} · {p.subStat[s]?.h ?? 0}/{p.subStat[s]?.t ?? 0}</option>)}
                            </select>
                        )}
                    </div>
                )}
            </section>

            {p.err && <p className="px-1 text-xs font-medium text-rose-600 dark:text-rose-400">{p.err}</p>}

            <section>
                <p className={'mb-1 px-1 text-[11px] ' + MUTED}>Daftar peserta ({p.count})</p>
                {p.view.length === 0 ? (
                    <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>{p.total === 0 ? 'Belum ada data check-in.' : 'Tidak ada data yang cocok.'}</div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {p.view.map((r) => {
                                const meta = [r.kind === 'pengunjung' ? 'Pengunjung' : 'Peserta', r.also ? 'Juga peserta' : null, r.type ? (r.type.includes(' - ') ? r.type.slice(r.type.lastIndexOf(' - ') + 3) : r.type) : null, r.sub, r.buyer].filter(Boolean).join(' · ');
                                return (
                                    <div key={r.code} title={r.code} className={'rounded-2xl p-3 ' + CARD}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm leading-tight font-semibold">{r.name}</p>
                                                <p className="mt-0.5 truncate font-mono text-[11px] text-indigo-600 dark:text-indigo-300">{r.reg_id ?? r.code}</p>
                                            </div>
                                            {r.at ? (
                                                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Hadir</span>
                                            ) : (
                                                <span className="shrink-0 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">Belum</span>
                                            )}
                                        </div>
                                        <p className={'mt-1.5 truncate text-xs ' + MUTED}>{meta}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <span className={'text-[11px] ' + MUTED}>{r.at ? 'Check-in ' + r.at : 'Belum check-in'}</span>
                                            {!r.at && (
                                                <button type="button" disabled={p.busy === r.code} onClick={() => p.onCheckin(r)} className={'h-10 shrink-0 rounded-full bg-indigo-600 px-4 text-xs font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                                                    {p.busy === r.code ? '...' : 'Check-in'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex items-center justify-between px-1">
                            <span className={'text-[11px] ' + MUTED}>{p.count} total</span>
                            <div className="flex items-center gap-0.5">
                                <button type="button" aria-label="Sebelumnya" disabled={p.cur <= 1} onClick={() => p.setPage(p.cur - 1)} className={pgBtn}><ChevronLeft className="size-4" /></button>
                                {nums.map((n) => <button key={n} type="button" onClick={() => p.setPage(n)} aria-current={n === p.cur ? 'page' : undefined} className={pgNum(n === p.cur)}>{n}</button>)}
                                <button type="button" aria-label="Berikutnya" disabled={p.cur >= p.pages} onClick={() => p.setPage(p.cur + 1)} className={pgBtn}><ChevronRight className="size-4" /></button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
