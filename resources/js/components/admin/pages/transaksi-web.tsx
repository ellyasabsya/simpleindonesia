import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Inbox, Search } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

type Row = {
    at: string; code: string; type: string; dir: string; title: string; subtitle: string;
    method: string; status: string; amount: number; fee: number;
};
type Summary = { masuk: number; masuk_count: number; keluar: number; keluar_count: number; selisih: number; fee: number };
type Filters = { range: string; from: string; to: string; type: string; dir: string; method: string; status: string; q: string };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const shift = (d: Date, days: number) => { const n = new Date(d); n.setDate(n.getDate() + days); return n; };
const show = (s: string) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

const TYPE: Record<string, string> = { tiket: 'Tiket', paket: 'Paket event', penarikan: 'Penarikan' };
const STATUS: Record<string, { label: string; style: string }> = {
    lunas: { label: 'Lunas', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    menunggu: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    gagal: { label: 'Gagal', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
    dikembalikan: { label: 'Dikembalikan', style: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200' },
};

const card = 'rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100';

export default function Transaksi({ rows, summary, filters, pg }: { rows: Row[]; summary: Summary; filters: Filters; pg: Pg }) {
    const [search, setSearch] = useState(filters.q);

    const go = (params: Partial<Filters> & { page?: number }) => {
        const next = { ...filters, q: search, ...params } as Record<string, string | number>;
        if (next.range === 'semua') { delete next.from; delete next.to; }
        router.get('/admin/transaksi', next, { preserveState: true, replace: true });
    };

    const today = new Date();
    const preset = (from: Date, to: Date) => go({ range: 'tanggal', from: ymd(from), to: ymd(to), page: 1 });
    const isRange = (from: Date, to: Date) => filters.range === 'tanggal' && filters.from === ymd(from) && filters.to === ymd(to);
    const move = (dir: 1 | -1) => {
        if (filters.range === 'semua' || !filters.from || !filters.to) return;
        const f = parse(filters.from); const t = parse(filters.to);
        const span = Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
        preset(shift(f, dir * span), shift(t, dir * span));
    };

    const csvQuery = new URLSearchParams(Object.entries({ ...filters, q: search }).filter(([k, v]) => v !== '' && !(filters.range === 'semua' && (k === 'from' || k === 'to'))) as [string, string][]).toString();

    const tabs: { label: string; active: boolean; on: () => void }[] = [
        { label: 'Hari ini', active: isRange(today, today), on: () => preset(today, today) },
        { label: 'Kemarin', active: isRange(shift(today, -1), shift(today, -1)), on: () => preset(shift(today, -1), shift(today, -1)) },
        { label: '7 hari', active: isRange(shift(today, -6), today), on: () => preset(shift(today, -6), today) },
        { label: 'Semua', active: filters.range === 'semua', on: () => go({ range: 'semua', page: 1 }) },
    ];

    const cards = [
        { label: 'Uang masuk', value: rp(summary.masuk), note: `${summary.masuk_count} transaksi lunas`, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Uang keluar', value: rp(summary.keluar), note: `${summary.keluar_count} penarikan dana`, color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Selisih', value: rp(summary.selisih), note: 'Masuk dikurangi keluar', color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Biaya layanan', value: rp(summary.fee), note: 'Sudah termasuk di uang masuk', color: 'text-violet-600 dark:text-violet-400' },
    ];

    const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500';
    const td = 'px-4 py-3.5 align-middle';
    const group = 'flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/80 p-1.5 dark:border-white/10 dark:bg-white/5';

    return (
        <AdminLayout title="Transaksi">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Buku Transaksi
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold">Riwayat Transaksi</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/80">
                            Semua uang masuk dan keluar platform: tiket, paket event, dan penarikan dana. Total hanya menghitung transaksi berstatus lunas.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((c) => (
                        <div key={c.label} className={`${card} p-5`}>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
                            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${c.color}`}>{c.value}</div>
                            <div className="mt-1 text-xs text-slate-500">{c.note}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className={group}>
                        {tabs.map((t) => (
                            <button key={t.label} type="button" onClick={t.on}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${t.active ? 'bg-indigo-700 text-white shadow' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className={group}>
                        <button type="button" onClick={() => move(-1)} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                        <input type="date" className={field} value={filters.from} onChange={(e) => go({ range: 'tanggal', from: e.target.value, to: filters.to || e.target.value, page: 1 })} />
                        <span className="text-xs font-semibold text-slate-400">s/d</span>
                        <input type="date" className={field} value={filters.to} onChange={(e) => go({ range: 'tanggal', to: e.target.value, from: filters.from || e.target.value, page: 1 })} />
                        <button type="button" onClick={() => move(1)} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                    <a href={`/admin/transaksi/csv?${csvQuery}`}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">
                        <Download className="h-4 w-4" /> Ekspor CSV
                    </a>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="space-y-3 p-5">
                        <form onSubmit={(e) => { e.preventDefault(); go({ page: 1 }); }} className="relative">
                            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode, nama, atau event..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5" />
                        </form>
                        <div className="flex flex-wrap gap-2">
                            <select className={field} value={filters.type} onChange={(e) => go({ type: e.target.value, page: 1 })}>
                                <option value="semua">Semua jenis</option>
                                <option value="tiket">Tiket</option>
                                <option value="paket">Paket event</option>
                                <option value="penarikan">Penarikan</option>
                            </select>
                            <select className={field} value={filters.dir} onChange={(e) => go({ dir: e.target.value, page: 1 })}>
                                <option value="semua">Masuk &amp; keluar</option>
                                <option value="masuk">Uang masuk</option>
                                <option value="keluar">Uang keluar</option>
                            </select>
                            <select className={field} value={filters.method} onChange={(e) => go({ method: e.target.value, page: 1 })}>
                                <option value="semua">Online &amp; manual</option>
                                <option value="online">Online</option>
                                <option value="manual">Manual</option>
                            </select>
                            <select className={field} value={filters.status} onChange={(e) => go({ status: e.target.value, page: 1 })}>
                                <option value="lunas">Lunas</option>
                                <option value="menunggu">Menunggu</option>
                                <option value="gagal">Gagal</option>
                                <option value="dikembalikan">Dikembalikan</option>
                                <option value="semua">Semua status</option>
                            </select>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 border-t border-slate-200 px-6 py-16 text-center dark:border-white/10">
                            <Inbox className="h-8 w-8 text-slate-400" />
                            <p className="font-bold text-slate-700 dark:text-slate-100">Belum ada transaksi</p>
                            <p className="text-sm text-slate-500">Ubah tanggal atau filter untuk melihat transaksi lain.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        {['Tanggal', 'Kode', 'Jenis', 'Keterangan', 'Metode', 'Status', 'Jumlah'].map((h) => (
                                            <th key={h} className={`${th} ${h === 'Jumlah' ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {rows.map((r) => (
                                        <tr key={r.code}>
                                            <td className={`${td} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{show(r.at.slice(0, 10))} {r.at.slice(11)}</td>
                                            <td className={`${td} font-mono text-xs font-semibold text-slate-700 dark:text-slate-200`}>{r.code}</td>
                                            <td className={`${td} font-semibold text-slate-700 dark:text-slate-200`}>{TYPE[r.type] ?? r.type}</td>
                                            <td className={td}>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{r.title}</p>
                                                <p className="text-xs text-slate-500">{r.subtitle}</p>
                                            </td>
                                            <td className={`${td} capitalize text-slate-600 dark:text-slate-300`}>{r.method}</td>
                                            <td className={td}>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[r.status]?.style ?? ''}`}>{STATUS[r.status]?.label ?? r.status}</span>
                                            </td>
                                            <td className={`${td} text-right font-extrabold tabular-nums ${r.dir === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {r.dir === 'masuk' ? '+' : '-'}{rp(r.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="transaksi" />
                </div>
            </div>
        </AdminLayout>
    );
}
