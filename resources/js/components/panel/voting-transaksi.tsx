import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export type VotingStats = { orders: number; gross: number; fee: number; net: number; votes: number; avg: number; pending: number; failed: number };
type St = 'all' | 'lunas' | 'menunggu' | 'batal';
type Row = {
    id: number; code: string; created_at: string | null; paid_at: string | null; buyer_name: string; buyer_email: string | null; participant: string; category: string | null;
    gift: string | null; votes: number; amount: number; service_fee: number; net: number; status: Exclude<St, 'all'>; payment_type: string | null;
};
type Resp = { stats: VotingStats; counts: Record<St, number>; orders: { data: Row[]; page: number; last_page: number; total: number } };

const num = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const rp = (n: number) => `Rp${num(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const inp = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:text-sm dark:border-white/10 dark:bg-slate-900';
const th = 'border-b border-r border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 last:border-r-0 dark:border-white/10 dark:text-slate-200';
const td = 'border-b border-r border-slate-100 px-3 py-2.5 align-middle last:border-r-0 dark:border-white/10';
const pgIcon = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10';
const pgNum = (on: boolean) => `inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-extrabold ${on ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`;
const STATUS: Record<Exclude<St, 'all'>, { t: string; c: string }> = {
    lunas: { t: 'Lunas', c: 'bg-emerald-100 text-emerald-800' },
    menunggu: { t: 'Menunggu', c: 'bg-amber-100 text-amber-800' },
    batal: { t: 'Batal', c: 'bg-rose-100 text-rose-700' },
};
const FILTERS: [St, string][] = [['all', 'Semua status'], ['lunas', 'Lunas'], ['menunggu', 'Menunggu'], ['batal', 'Batal']];
const PER_PAGE = [10, 15, 25, 50];
const PAY: Record<string, string> = { credit_card: 'Kartu kredit', gopay: 'GoPay', qris: 'QRIS', bank_transfer: 'Transfer bank', shopeepay: 'ShopeePay', echannel: 'Mandiri VA', cstore: 'Gerai retail' };
const payLabel = (r: Row) => (r.payment_type ? (PAY[r.payment_type] ?? r.payment_type) : '-');
const when = (s: string | null) => {
    if (!s) return '-';
    const d = new Date(s.replace(' ', 'T'));
    return isNaN(d.getTime()) ? s : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const pageWindow = (cur: number, last: number) => {
    const s = Math.max(1, Math.min(cur - 2, last - 4));
    const e = Math.min(last, s + 4);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
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
    const x = STATUS[s] ?? { t: s, c: 'bg-slate-100 text-slate-700' };
    return <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${x.c}`}>{x.t}</span>;
}

function Stat({ label, value, sub, accent, compact }: { label: string; value: string; sub?: string; accent?: boolean; compact?: boolean }) {
    return (
        <div className="min-w-0">
            <div className={compact ? 'text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300' : lbl}>{label}</div>
            <div className={`${compact ? 'mt-1 text-lg font-semibold' : 'mt-2 text-2xl font-extrabold sm:text-3xl'} break-words ${accent ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{value}</div>
            {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
        </div>
    );
}

export default function VotingTransaksi({ base, compact = false, showStats, onStats }: { base: string; compact?: boolean; showStats?: boolean; onStats?: (s: VotingStats) => void }) {
    const withStats = showStats ?? compact;
    const field = compact ? `${inp.replace('text-base', 'text-sm')} h-10` : inp;
    const [data, setData] = useState<Resp | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<St>('all');
    const [q, setQ] = useState('');
    const [term, setTerm] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    useEffect(() => {
        const t = setTimeout(() => { setTerm(q.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const ctrl = new AbortController();
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(page), per_page: String(perPage) });
        if (term) params.set('q', term);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        fetchJson(`${base}/transaksi?${params.toString()}`, ctrl.signal)
            .then((j) => { setData(j); setError(''); onStats?.(j.stats); })
            .catch((e: unknown) => { if ((e as Error).name !== 'AbortError') setError('Gagal memuat data transaksi. Coba muat ulang.'); })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, status, term, from, to, page, perPage]);

    const o = data?.orders;
    const rows = o?.data ?? [];
    const last = o?.last_page ?? 1;
    const filtered = status !== 'all' || !!term || !!from || !!to;
    const cardsCls = compact ? '' : 'md:hidden';
    const tableCls = compact ? 'hidden' : 'hidden overflow-x-auto md:block';

    return (
        <div className="space-y-5">
            {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
            {!data && loading && <div className={`${card} p-8 text-center text-sm text-slate-500`}>Memuat data transaksi…</div>}

            {data && withStats && (
                <div className={`${card} p-4 sm:p-6`}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <Stat compact={compact} label="Pendapatan event" value={rp(data.stats.net)} sub="Total dibayar − biaya layanan" accent />
                        <Stat compact={compact} label="Transaksi lunas" value={num(data.stats.orders)} sub={`Rata-rata ${rp(data.stats.avg)}`} />
                        <Stat compact={compact} label="Vote terjual" value={num(data.stats.votes)} />
                        <Stat compact={compact} label="Menunggu bayar" value={num(data.stats.pending)} sub={`${num(data.stats.failed)} batal atau gagal`} />
                    </div>
                </div>
            )}

            {data && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-white/10">
                        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={compact ? 'Cari kode, nama, peserta' : 'Cari kode, nama, email, peserta'} maxLength={60} className={`${field} w-full pl-9`} />
                        </div>
                        <select value={status} onChange={(e) => { setStatus(e.target.value as St); setPage(1); }} className={field} aria-label="Filter status">
                            {FILTERS.map(([v, t]) => <option key={v} value={v}>{t} ({data.counts?.[v] ?? 0})</option>)}
                        </select>
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={field} aria-label="Dari tanggal" />
                            <span className="text-xs text-slate-500">s/d</span>
                            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={field} aria-label="Sampai tanggal" />
                            {filtered && (
                                <button type="button" onClick={() => { setStatus('all'); setQ(''); setTerm(''); setFrom(''); setTo(''); setPage(1); }} className="text-xs font-bold text-indigo-700 hover:underline dark:text-indigo-300">Reset</button>
                            )}
                        </div>
                    </div>

                    <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
                        {!loading && rows.length === 0 && (
                            <div className="px-4 py-12 text-center text-sm text-slate-500">{filtered ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}</div>
                        )}

                        {rows.length > 0 && (
                            <>
                                {/* Desktop: data-grid */}
                                <div className={tableCls}>
                                    <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-white/5">
                                                <th className={th}>Kode</th>
                                                <th className={th}>Tanggal</th>
                                                <th className={th}>Pembeli</th>
                                                <th className={th}>Peserta</th>
                                                <th className={`${th} text-right`}>Vote</th>
                                                <th className={`${th} text-right`}>Subtotal</th>
                                                <th className={`${th} text-right`}>Layanan</th>
                                                <th className={`${th} text-right`}>Total</th>
                                                <th className={th}>Bayar</th>
                                                <th className={th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r) => (
                                                <tr key={r.id} className="transition-colors hover:bg-indigo-50/60 dark:hover:bg-white/5">
                                                    <td className={`${td} whitespace-nowrap font-extrabold`}>{r.code}</td>
                                                    <td className={`${td} whitespace-nowrap text-xs text-slate-600 dark:text-slate-300`}>{when(r.created_at)}</td>
                                                    <td className={td}><div className="font-bold">{r.buyer_name}</div>{r.buyer_email && <div className="text-xs text-slate-500">{r.buyer_email}</div>}</td>
                                                    <td className={td}>
                                                        <div className="font-bold">{r.participant}</div>
                                                        <div className="text-xs text-slate-500">{[r.category, r.gift].filter(Boolean).join(' · ') || '-'}</div>
                                                    </td>
                                                    <td className={`${td} whitespace-nowrap text-right font-bold tabular-nums`}>{num(r.votes)}</td>
                                                    <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{rp(r.amount - r.service_fee)}</td>
                                                    <td className={`${td} whitespace-nowrap text-right tabular-nums text-slate-600 dark:text-slate-300`}>{r.service_fee > 0 ? rp(r.service_fee) : '-'}</td>
                                                    <td className={`${td} whitespace-nowrap text-right font-extrabold tabular-nums`}>{rp(r.amount)}</td>
                                                    <td className={`${td} whitespace-nowrap text-xs`}>{payLabel(r)}</td>
                                                    <td className={td}><Badge s={r.status} />{r.status === 'lunas' && <div className="mt-1 whitespace-nowrap text-xs text-slate-500">{when(r.paid_at)}</div>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* HP: kartu */}
                                <ul className={`${cardsCls} space-y-3 p-3`}>
                                    {rows.map((r) => (
                                        <li key={r.id} className="rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0"><div className={`truncate text-sm ${compact ? 'font-semibold' : 'font-extrabold'}`}>{r.code}</div><div className="text-[11px] text-slate-500">{when(r.created_at)}</div></div>
                                                <Badge s={r.status} />
                                            </div>
                                            <div className="mt-2 text-sm font-bold">{r.buyer_name}</div>
                                            {r.buyer_email && <div className="truncate text-xs text-slate-500">{r.buyer_email}</div>}
                                            <div className="mt-2 flex items-end justify-between gap-3">
                                                <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300">
                                                    untuk {r.participant}{r.gift ? ` · ${r.gift}` : ''}
                                                    <div className="text-slate-500">{num(r.votes)} vote · {payLabel(r)}</div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className={`${compact ? 'text-sm font-semibold' : 'text-base font-extrabold'} text-indigo-700 dark:text-indigo-300`}>{rp(r.amount)}</div>
                                                    {r.service_fee > 0 && <div className="text-[11px] text-slate-500">layanan {rp(r.service_fee)}</div>}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Footer: total + pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <span className="text-xs font-bold text-slate-500">{num(o?.total ?? 0)} total</span>
                        <div className="flex flex-wrap items-center gap-1">
                            <button type="button" className={pgIcon} disabled={page <= 1 || loading} onClick={() => setPage(1)} aria-label="Halaman pertama"><ChevronsLeft className="h-4 w-4" /></button>
                            <button type="button" className={pgIcon} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                            {pageWindow(page, last).map((n) => (
                                <button key={n} type="button" disabled={loading} onClick={() => setPage(n)} className={pgNum(n === page)} aria-current={n === page ? 'page' : undefined}>{n}</button>
                            ))}
                            <button type="button" className={pgIcon} disabled={page >= last || loading} onClick={() => setPage((p) => p + 1)} aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
                            <button type="button" className={pgIcon} disabled={page >= last || loading} onClick={() => setPage(last)} aria-label="Halaman terakhir"><ChevronsRight className="h-4 w-4" /></button>
                            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className={`${field} ml-2 py-1.5`} aria-label="Baris per halaman">
                                {PER_PAGE.map((n) => <option key={n} value={n}>{n} per halaman</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
