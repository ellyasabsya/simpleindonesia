import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Row = { code: string; reg_id: string | null; name: string; type: string | null; buyer: string | null; at: string | null; sub?: string | null; kind?: string; also?: boolean };
type Tab = 'semua' | 'hadir' | 'belum';

type Props = {
    scanner: ReactNode;
    hadir: number;
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

/** Check-in HP (ringkas): pemindai, satu kartu statistik + cari + filter, daftar rapat. */
export default function CheckinMobile(p: Props) {
    const tabs: [Tab, string][] = [['semua', 'Semua'], ['hadir', 'Hadir'], ['belum', 'Belum']];
    const twoSel = p.types.length > 1 && p.subs.length > 0;

    return (
        <div className="space-y-3 pb-24">
            <section className={'rounded-2xl p-3 ' + CARD}>{p.scanner}</section>

            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-[15px] font-semibold">
                            {p.hadir}<span className={'text-xs font-normal ' + MUTED}> / {p.total} hadir ({p.pct}%)</span>
                        </p>
                        <p className={'text-[11px] ' + MUTED}>Belum {p.total - p.hadir}</p>
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
                    <div className={GROUP}>
                        {p.view.map((r) => (
                            <div key={r.code} className="flex items-center gap-2.5 px-3 py-2">
                                <span className="min-w-0 flex-1" title={r.code}>
                                    <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                    <span className={'block truncate text-[11px] leading-snug ' + MUTED}>
                                        {[r.reg_id ?? r.code, r.kind === 'pengunjung' ? 'Pengunjung' : 'Peserta', r.also ? 'Juga peserta' : null, r.type ? (r.type.includes(' - ') ? r.type.slice(r.type.lastIndexOf(' - ') + 3) : r.type) : null, r.sub, r.buyer].filter(Boolean).join(' · ')}
                                    </span>
                                                                    </span>
                                {r.at ? (
                                    <span className="shrink-0 text-right">
                                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Hadir</span>
                                        <span className={'block text-[11px] ' + MUTED}>{r.at}</span>
                                    </span>
                                ) : (
                                    <button type="button" disabled={p.busy === r.code} onClick={() => p.onCheckin(r)} className={'h-10 shrink-0 rounded-full bg-indigo-600 px-3.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                                        {p.busy === r.code ? '...' : 'Check-in'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {p.pages > 1 && (
                    <nav className="mt-2 flex items-center justify-between gap-3">
                        <button type="button" disabled={p.cur <= 1} onClick={() => p.setPage(p.cur - 1)} aria-label="Sebelumnya" className={'flex size-9 items-center justify-center rounded-full disabled:opacity-40 ' + CARD}><ChevronLeft className="size-4" /></button>
                        <span className={'text-xs ' + MUTED}>{p.cur} / {p.pages}</span>
                        <button type="button" disabled={p.cur >= p.pages} onClick={() => p.setPage(p.cur + 1)} aria-label="Berikutnya" className={'flex size-9 items-center justify-center rounded-full disabled:opacity-40 ' + CARD}><ChevronRight className="size-4" /></button>
                    </nav>
                )}
            </section>
        </div>
    );
}
