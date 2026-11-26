import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

type St = 'all' | 'lunas' | 'menunggu' | 'menunggu_verifikasi' | 'batal';
type Row = {
    id: number; code: string; group_code: string | null; buyer_name: string; buyer_email: string; quantity: number;
    subtotal: number; fee: number; total: number; status: Exclude<St, 'all'>; payment_method: string | null; payment_type: string | null;
    has_proof: boolean; reject_reason: string | null; visit_date: string | null; created_at: string | null; paid_at: string | null;
    type_name: string; event_title: string;
};
type Resp = { counts: Record<St, number>; orders: { data: Row[]; page: number; last_page: number; total: number } };

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const inp = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:text-sm dark:border-white/10 dark:bg-slate-900';
const th = 'border-b border-r border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 last:border-r-0 dark:border-white/10 dark:text-slate-200';
const td = 'border-b border-r border-slate-100 px-3 py-2.5 align-middle last:border-r-0 dark:border-white/10';
const pgIcon = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10';
const pgNum = (on: boolean) => `inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-extrabold ${on ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`;
const STATUS: Record<Exclude<St, 'all'>, { t: string; c: string }> = {
    lunas: { t: 'Lunas', c: 'bg-emerald-100 text-emerald-800' },
    menunggu: { t: 'Menunggu bayar', c: 'bg-amber-100 text-amber-800' },
    menunggu_verifikasi: { t: 'Verifikasi', c: 'bg-sky-100 text-sky-800' },
    batal: { t: 'Batal', c: 'bg-rose-100 text-rose-700' },
};
const FILTERS: [St, string][] = [['all', 'Semua status'], ['lunas', 'Lunas'], ['menunggu_verifikasi', 'Verifikasi'], ['menunggu', 'Menunggu bayar'], ['batal', 'Batal']];
const PER_PAGE = [10, 15, 25, 50];
const PAY: Record<string, string> = { credit_card: 'Kartu kredit', gopay: 'GoPay', qris: 'QRIS', bank_transfer: 'Transfer bank', shopeepay: 'ShopeePay', echannel: 'Mandiri VA', cstore: 'Gerai retail' };
const payLabel = (r: Row) => (r.total === 0 ? 'Gratis' : r.payment_method === 'transfer_manual' ? 'Transfer manual' : r.payment_type ? (PAY[r.payment_type] ?? r.payment_type) : '-');
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

function Badge({ r }: { r: Row }) {
    const s = STATUS[r.status] ?? { t: r.status, c: 'bg-slate-100 text-slate-700' };
    return <span title={r.reject_reason ?? undefined} className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${s.c}`}>{s.t}</span>;
}

export default function TiketTransaksi({ base, isParent = false }: { base: string; isParent?: boolean }) {
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
        fetch(`${base}/transaksi?${params.toString()}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal: ctrl.signal,
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((j: Resp) => { setData(j); setError(''); })
            .catch((e: unknown) => { if ((e as Error).name !== 'AbortError') setError('Gagal memuat transaksi. Coba muat ulang halaman.'); })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
        return () => ctrl.abort();
    }, [base, status, term, from, to, page, perPage]);

    const rows = data?.orders.data ?? [];
    const last = data?.orders.last_page ?? 1;
    const filtered = status !== 'all' || !!term || !!from || !!to;

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-white/10">
                <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode, nama, email" className={`${inp} w-full pl-9`} />
                </div>
                <select value={status} onChange={(e) => { setStatus(e.target.value as St); setPage(1); }} className={inp} aria-label="Filter status">
                    {FILTERS.map(([v, t]) => <option key={v} value={v}>{t} ({data?.counts[v] ?? 0})</option>)}
                </select>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={inp} aria-label="Dari tanggal" />
                    <span className="text-xs text-slate-500">s/d</span>
                    <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={inp} aria-label="Sampai tanggal" />
                    {filtered && (
                        <button type="button" onClick={() => { setStatus('all'); setQ(''); setTerm(''); setFrom(''); setTo(''); setPage(1); }} className="text-xs font-bold text-indigo-700 hover:underline dark:text-indigo-300">Reset</button>
                    )}
                </div>
            </div>

            {error && <p className="m-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

            <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
                {!loading && !error && rows.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-slate-500">{filtered ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}</div>
                )}

                {rows.length > 0 && (
                    <>
                        {/* Desktop: data-grid */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/5">
                                        <th className={th}>Kode</th>
                                        <th className={th}>Tanggal</th>
                                        <th className={th}>Pembeli</th>
                                        <th className={th}>Tiket</th>
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
                                            <td className={td}><div className="font-bold">{r.buyer_name}</div><div className="text-xs text-slate-500">{r.buyer_email}</div></td>
                                            <td className={td}>
                                                <div className="whitespace-nowrap font-bold">{r.type_name} × {r.quantity}</div>
                                                {isParent && <div className="text-xs text-indigo-700 dark:text-indigo-300">{r.event_title}</div>}
                                                {r.visit_date && <div className="text-xs text-slate-500">Berlaku {r.visit_date}</div>}
                                            </td>
                                            <td className={`${td} whitespace-nowrap text-right`}>{rp(r.subtotal)}</td>
                                            <td className={`${td} whitespace-nowrap text-right text-slate-600 dark:text-slate-300`}>{r.fee > 0 ? rp(r.fee) : '-'}</td>
                                            <td className={`${td} whitespace-nowrap text-right font-extrabold`}>{rp(r.total)}</td>
                                            <td className={`${td} whitespace-nowrap text-xs`}>{payLabel(r)}{r.has_proof && <div className="text-slate-500">Bukti terkirim</div>}</td>
                                            <td className={td}><Badge r={r} />{r.status === 'lunas' && <div className="mt-1 whitespace-nowrap text-xs text-slate-500">{when(r.paid_at)}</div>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* HP: kartu */}
                        <div className="space-y-3 p-3 md:hidden">
                            {rows.map((r) => (
                                <div key={r.id} className="rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0"><div className="truncate text-sm font-extrabold">{r.code}</div><div className="text-[11px] text-slate-500">{when(r.created_at)}</div></div>
                                        <Badge r={r} />
                                    </div>
                                    <div className="mt-2 text-sm font-bold">{r.buyer_name}</div>
                                    <div className="truncate text-xs text-slate-500">{r.buyer_email}</div>
                                    <div className="mt-2 flex items-end justify-between gap-3">
                                        <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300">{r.type_name} × {r.quantity}{isParent && <div className="truncate text-indigo-700 dark:text-indigo-300">{r.event_title}</div>}<div className="text-slate-500">{payLabel(r)}</div></div>
                                        <div className="shrink-0 text-right"><div className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">{rp(r.total)}</div>{r.fee > 0 && <div className="text-[11px] text-slate-500">layanan {rp(r.fee)}</div>}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Footer: total + pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs font-bold text-slate-500">{data?.orders.total ?? 0} total</span>
                <div className="flex flex-wrap items-center gap-1">
                    <button type="button" className={pgIcon} disabled={page <= 1 || loading} onClick={() => setPage(1)} aria-label="Halaman pertama"><ChevronsLeft className="h-4 w-4" /></button>
                    <button type="button" className={pgIcon} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                    {pageWindow(page, last).map((n) => (
                        <button key={n} type="button" disabled={loading} onClick={() => setPage(n)} className={pgNum(n === page)} aria-current={n === page ? 'page' : undefined}>{n}</button>
                    ))}
                    <button type="button" className={pgIcon} disabled={page >= last || loading} onClick={() => setPage((p) => p + 1)} aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
                    <button type="button" className={pgIcon} disabled={page >= last || loading} onClick={() => setPage(last)} aria-label="Halaman terakhir"><ChevronsRight className="h-4 w-4" /></button>
                    <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className={`${inp} ml-2 py-1.5`} aria-label="Baris per halaman">
                        {PER_PAGE.map((n) => <option key={n} value={n}>{n} per halaman</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
