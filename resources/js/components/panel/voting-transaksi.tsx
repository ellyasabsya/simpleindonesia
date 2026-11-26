import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type VotingStats = { orders: number; gross: number; fee: number; net: number; votes: number; avg: number; pending: number; failed: number };
type Row = {
    id: number; code: string; created_at: string | null; paid_at: string | null; buyer_name: string; participant: string; category: string | null;
    gift: string | null; votes: number; amount: number; service_fee: number; net: number; status: 'lunas' | 'menunggu' | 'batal'; payment_type: string | null;
};
type Resp = { stats: VotingStats; orders: { data: Row[]; page: number; last_page: number; total: number } };
type St = 'all' | 'lunas' | 'menunggu' | 'batal';

const PER_PAGE = 25;
const num = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const rp = (n: number) => `Rp${num(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const inp = 'rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:text-sm dark:border-white/10 dark:bg-white/5';
const pg = 'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-extrabold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/10';
const th = 'border-b border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-white/10';
const td = 'border-b border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-white/10';
const STATUS = {
    lunas: { t: 'Lunas', c: 'bg-emerald-100 text-emerald-800' },
    menunggu: { t: 'Menunggu', c: 'bg-amber-100 text-amber-800' },
    batal: { t: 'Batal', c: 'bg-rose-100 text-rose-700' },
} as const;
const PAY: Record<string, string> = { credit_card: 'Kartu kredit', gopay: 'GoPay', qris: 'QRIS', bank_transfer: 'Transfer bank', shopeepay: 'ShopeePay', echannel: 'Mandiri VA', cstore: 'Gerai retail' };
const when = (s: string | null) => {
    if (!s) return '-';
    const d = new Date(s.replace(' ', 'T'));
    return isNaN(d.getTime()) ? s : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fetchJson = (url: string, signal?: AbortSignal): Promise<Resp> =>
    fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

/** Statistik ringkas untuk kartu header halaman Voting. */
export function useVotingStats(base: string) {
    const [stats, setStats] = useState<VotingStats | null>(null);
    useEffect(() => {
        const ctrl = new AbortController();
        fetchJson(`${base}/transaksi?status=lunas&page=1`, ctrl.signal).then((j) => setStats(j.stats)).catch(() => undefined);
        return () => ctrl.abort();
    }, [base]);
    return { stats, setStats };
}

function Badge({ s }: { s: Row['status'] }) {
    return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[s].c}`}>{STATUS[s].t}</span>;
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
    return (
        <div className="min-w-0">
            <div className={lbl}>{label}</div>
            <div className={`mt-2 break-words text-2xl font-extrabold sm:text-3xl ${accent ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{value}</div>
            {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
        </div>
    );
}

function pageList(cur: number, last: number): (number | '…')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const s = new Set([1, last, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= last));
    const out: (number | '…')[] = [];
    let prev = 0;
    [...s].sort((a, b) => a - b).forEach((n) => { if (n - prev > 1) out.push('…'); out.push(n); prev = n; });
    return out;
}

export default function VotingTransaksi({ base, compact = false, showStats, onStats }: { base: string; compact?: boolean; showStats?: boolean; onStats?: (s: VotingStats) => void }) {
    const withStats = showStats ?? compact;
    const [data, setData] = useState<Resp | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<St>('all');
    const [q, setQ] = useState('');
    const [term, setTerm] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => { setTerm(q.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const ctrl = new AbortController();
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(page) });
        if (term) params.set('q', term);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        fetchJson(`${base}/transaksi?${params.toString()}`, ctrl.signal)
            .then((j) => { setData(j); setError(''); onStats?.(j.stats); })
            .catch((e: unknown) => { if ((e as Error).name !== 'AbortError') setError('Gagal memuat data transaksi. Coba muat ulang.'); })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, status, term, from, to, page, tick]);

    const o = data?.orders;
    const filtered = status !== 'all' || q !== '' || from !== '' || to !== '';
    const reset = () => { setStatus('all'); setQ(''); setTerm(''); setFrom(''); setTo(''); setPage(1); };
    const cardsCls = compact ? '' : 'md:hidden';
    const tableCls = compact ? 'hidden' : 'hidden md:block';
    const sum = (f: (r: Row) => number) => (o ? o.data.reduce((a, r) => a + f(r), 0) : 0);
    const first = o && o.total > 0 ? (o.page - 1) * PER_PAGE + 1 : 0;
    const last = o ? Math.min(o.page * PER_PAGE, o.total) : 0;

    return (
        <div className="space-y-5">
            {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
            {!data && loading && <div className={`${card} p-8 text-center text-sm text-slate-500`}>Memuat data transaksi…</div>}

            {data && withStats && (
                <div className={`${card} p-4 sm:p-6`}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <Stat label="Pendapatan event" value={rp(data.stats.net)} sub="Total dibayar − biaya layanan" accent />
                        <Stat label="Transaksi lunas" value={num(data.stats.orders)} sub={`Rata-rata ${rp(data.stats.avg)}`} />
                        <Stat label="Vote terjual" value={num(data.stats.votes)} />
                        <Stat label="Menunggu bayar" value={num(data.stats.pending)} sub={`${num(data.stats.failed)} batal atau gagal`} />
                    </div>
                </div>
            )}

            {data && (
                <div className={`${card} overflow-hidden`}>
                    {/* Toolbar: cari + filter */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10">
                        <label className="relative block min-w-[220px] flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode, nama pembeli, atau peserta" maxLength={60} className={`${inp} w-full pl-9`} />
                        </label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value as St); setPage(1); }} aria-label="Filter status" className={`${inp} w-full sm:w-40`}>
                            <option value="all">Semua status</option>
                            <option value="lunas">Lunas</option>
                            <option value="menunggu">Menunggu</option>
                            <option value="batal">Batal</option>
                        </select>
                        <input type="date" aria-label="Dari tanggal" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`${inp} w-full sm:w-40`} />
                        <input type="date" aria-label="Sampai tanggal" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={`${inp} w-full sm:w-40`} />
                        {filtered && (
                            <button type="button" onClick={reset} className={pg}><X className="h-4 w-4" /> Reset</button>
                        )}
                        <button type="button" onClick={() => setTick((t) => t + 1)} aria-label="Muat ulang" title="Muat ulang" className={pg}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
                    </div>

                    <div className={`transition ${loading ? 'opacity-60' : ''}`}>
                        {o && o.data.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Belum ada transaksi yang cocok.</div>}

                        {o && o.data.length > 0 && (
                            <>
                                <div className={tableCls}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-white/5">
                                                <tr className={lbl}>
                                                    <th className={th}>Waktu</th>
                                                    <th className={th}>Kode</th>
                                                    <th className={th}>Pembeli</th>
                                                    <th className={th}>Peserta</th>
                                                    <th className={`${th} text-right`}>Vote</th>
                                                    <th className={`${th} text-right`}>Dibayar</th>
                                                    <th className={`${th} text-right`}>Pendapatan</th>
                                                    <th className={th}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {o.data.map((r) => {
                                                    const [d, t] = when(r.paid_at ?? r.created_at).split(', ');
                                                    return (
                                                        <tr key={r.id} className="transition hover:bg-indigo-50/50 dark:hover:bg-white/5">
                                                            <td className={`${td} whitespace-nowrap`}>
                                                                <div className="font-bold">{d}</div>
                                                                <div className="text-xs text-slate-500">{t ?? ''}</div>
                                                            </td>
                                                            <td className={td}>
                                                                <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold tracking-wide dark:bg-white/10">{r.code}</span>
                                                            </td>
                                                            <td className={td}>
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold uppercase text-indigo-700">{(r.buyer_name || '?').charAt(0)}</span>
                                                                    <span className="font-bold">{r.buyer_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className={td}>
                                                                <div className="font-bold">{r.participant}</div>
                                                                <div className="text-xs text-slate-500">{[r.category, r.gift].filter(Boolean).join(' · ') || '-'}</div>
                                                            </td>
                                                            <td className={`${td} text-right font-bold tabular-nums`}>{num(r.votes)}</td>
                                                            <td className={`${td} whitespace-nowrap text-right tabular-nums`}>
                                                                <div className="font-semibold">{rp(r.amount)}</div>
                                                                <div className="text-xs text-slate-500">fee {rp(r.service_fee)}</div>
                                                            </td>
                                                            <td className={`${td} whitespace-nowrap text-right font-extrabold tabular-nums ${r.status === 'lunas' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                                {r.status === 'lunas' ? rp(r.net) : '-'}
                                                            </td>
                                                            <td className={td}>
                                                                <Badge s={r.status} />
                                                                {r.payment_type && <div className="mt-1 text-xs text-slate-500">{PAY[r.payment_type] ?? r.payment_type}</div>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-slate-50 font-extrabold dark:bg-white/5">
                                                <tr>
                                                    <td colSpan={4} className={`${td} border-b-0 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300`}>Total halaman ini ({o.data.length} transaksi)</td>
                                                    <td className={`${td} border-b-0 text-right tabular-nums`}>{num(sum((r) => (r.status === 'lunas' ? r.votes : 0)))}</td>
                                                    <td className={`${td} border-b-0 whitespace-nowrap text-right tabular-nums`}>{rp(sum((r) => (r.status === 'lunas' ? r.amount : 0)))}</td>
                                                    <td className={`${td} border-b-0 whitespace-nowrap text-right tabular-nums text-emerald-700 dark:text-emerald-400`}>{rp(sum((r) => (r.status === 'lunas' ? r.net : 0)))}</td>
                                                    <td className={`${td} border-b-0 text-xs font-medium text-slate-500`}>Hanya lunas</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <ul className={`${cardsCls} space-y-2 p-3`}>
                                    {o.data.map((r) => (
                                        <li key={r.id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0"><div className="truncate text-sm font-extrabold">{r.buyer_name}</div><div className="truncate text-xs text-slate-500">untuk {r.participant}{r.gift ? ` · ${r.gift}` : ''}</div></div>
                                                <Badge s={r.status} />
                                            </div>
                                            <div className="mt-2 flex items-end justify-between gap-2">
                                                <div className="text-xs text-slate-500">{when(r.paid_at ?? r.created_at)}<br /><span className="font-mono">{r.code}</span> · {num(r.votes)} vote</div>
                                                <div className="text-right"><div className="text-sm font-extrabold">{r.status === 'lunas' ? rp(r.net) : rp(r.amount)}</div><div className="text-[11px] text-slate-500">{r.status === 'lunas' ? `dibayar ${rp(r.amount)}` : 'belum masuk'}</div></div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Footer: info + paginasi */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-white/10">
                                    <span className="text-xs text-slate-500">Menampilkan {num(first)}–{num(last)} dari {num(o.total)} transaksi</span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button type="button" disabled={o.page <= 1 || loading} onClick={() => setPage(o.page - 1)} aria-label="Sebelumnya" className={pg}><ChevronLeft className="h-4 w-4" /></button>
                                        {pageList(o.page, o.last_page).map((n, i) => n === '…'
                                            ? <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                                            : <button key={n} type="button" disabled={loading} onClick={() => setPage(n)} className={`${pg} ${n === o.page ? '!border-indigo-700 !bg-indigo-700 text-white hover:!bg-indigo-700' : ''}`}>{n}</button>)}
                                        <button type="button" disabled={o.page >= o.last_page || loading} onClick={() => setPage(o.page + 1)} aria-label="Berikutnya" className={pg}><ChevronRight className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
