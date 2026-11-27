import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Inbox, Search } from 'lucide-react';
import { useState } from 'react';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

type Row = {
    at: string; code: string; type: string; dir: string; title: string; subtitle: string;
    method: string; status: string; amount: number; fee: number;
};
type Summary = { masuk: number; masuk_count: number; keluar: number; keluar_count: number; selisih: number; fee: number };
type Filters = { range: string; from: string; to: string; type: string; dir: string; method: string; status: string; q: string };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };
type Props = { rows: Row[]; summary: Summary; filters: Filters; pg: Pg };

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const shift = (d: Date, days: number) => {
    const n = new Date(d);
    n.setDate(n.getDate() + days);
    return n;
};
const show = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
};

const TYPE: Record<string, string> = { tiket: 'Tiket', paket: 'Paket event', penarikan: 'Penarikan' };
const STATUS: Record<string, { label: string; style: string }> = {
    lunas: { label: 'Lunas', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    menunggu: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    gagal: { label: 'Gagal', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
    dikembalikan: { label: 'Dikembalikan', style: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200' },
};

const sel = 'h-10 w-full rounded-full border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-white/5';

export default function TransaksiAdminMobile({ rows, summary, filters, pg }: Props) {
    const [search, setSearch] = useState(filters.q);

    const go = (params: Partial<Filters> & { page?: number }) => {
        const next = { ...filters, q: search, ...params } as Record<string, string | number>;
        if (next.range === 'semua') {
            delete next.from;
            delete next.to;
        }
        router.get('/admin/transaksi', next, { preserveState: true, replace: true });
    };

    const today = new Date();
    const preset = (from: Date, to: Date) => go({ range: 'tanggal', from: ymd(from), to: ymd(to), page: 1 });
    const isRange = (from: Date, to: Date) => filters.range === 'tanggal' && filters.from === ymd(from) && filters.to === ymd(to);
    const move = (dir: 1 | -1) => {
        if (filters.range === 'semua' || !filters.from || !filters.to) return;
        const f = parse(filters.from);
        const t = parse(filters.to);
        const span = Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
        preset(shift(f, dir * span), shift(t, dir * span));
    };

    const csvQuery = new URLSearchParams(
        Object.entries({ ...filters, q: search }).filter(([k, v]) => v !== '' && !(filters.range === 'semua' && (k === 'from' || k === 'to'))) as [string, string][],
    ).toString();

    const tabs = [
        { label: 'Hari ini', active: isRange(today, today), on: () => preset(today, today) },
        { label: 'Kemarin', active: isRange(shift(today, -1), shift(today, -1)), on: () => preset(shift(today, -1), shift(today, -1)) },
        { label: '7 hari', active: isRange(shift(today, -6), today), on: () => preset(shift(today, -6), today) },
        { label: 'Semua', active: filters.range === 'semua', on: () => go({ range: 'semua', page: 1 }) },
    ];

    const tiles = [
        { label: 'Uang masuk', value: rp(summary.masuk), note: `${summary.masuk_count} transaksi lunas`, color: 'text-emerald-600 dark:text-emerald-300' },
        { label: 'Uang keluar', value: rp(summary.keluar), note: `${summary.keluar_count} penarikan dana`, color: 'text-rose-600 dark:text-rose-300' },
        { label: 'Selisih', value: rp(summary.selisih), note: 'Masuk dikurangi keluar', color: 'text-blue-600 dark:text-blue-300' },
        { label: 'Biaya layanan', value: rp(summary.fee), note: 'Sudah termasuk di uang masuk', color: 'text-violet-600 dark:text-violet-300' },
    ];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Riwayat Transaksi</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Semua uang masuk dan keluar platform. Total hanya menghitung transaksi berstatus lunas.
                </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
                {tiles.map((c) => (
                    <div key={c.label} className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD + (c.value.length > 12 ? ' col-span-2' : '')}>
                        <p className={'text-xs leading-snug font-medium ' + MUTED}>{c.label}</p>
                        <p className={'text-[17px] leading-none font-semibold tabular-nums ' + c.color}>{c.value}</p>
                        <p className={'text-[11px] leading-snug ' + MUTED}>{c.note}</p>
                    </div>
                ))}
            </div>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {tabs.map((t) => (
                    <button
                        key={t.label}
                        type="button"
                        onClick={t.on}
                        className={'inline-flex h-10 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' + (t.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-1.5">
                <button type="button" onClick={() => move(-1)} aria-label="Sebelumnya" className={'flex size-10 items-center justify-center rounded-full ' + CARD}>
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => go({ range: 'tanggal', from: e.target.value, to: filters.to || e.target.value, page: 1 })}
                    className="h-10 min-w-0 rounded-full border border-slate-200 bg-white px-2 text-[13px] outline-none dark:border-white/10 dark:bg-white/5"
                />
                <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => go({ range: 'tanggal', to: e.target.value, from: filters.from || e.target.value, page: 1 })}
                    className="h-10 min-w-0 rounded-full border border-slate-200 bg-white px-2 text-[13px] outline-none dark:border-white/10 dark:bg-white/5"
                />
                <button type="button" onClick={() => move(1)} aria-label="Berikutnya" className={'flex size-10 items-center justify-center rounded-full ' + CARD}>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <a href={`/admin/transaksi/csv?${csvQuery}`} className="flex h-10 items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-semibold text-white">
                <Download className="h-4 w-4" /> Ekspor CSV
            </a>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ page: 1 });
                }}
                className="relative"
            >
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kode, nama, atau event..."
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </form>

            <div className="grid grid-cols-2 gap-2">
                <select className={sel} value={filters.type} onChange={(e) => go({ type: e.target.value, page: 1 })}>
                    <option value="semua">Semua jenis</option>
                    <option value="tiket">Tiket</option>
                    <option value="paket">Paket event</option>
                    <option value="penarikan">Penarikan</option>
                </select>
                <select className={sel} value={filters.dir} onChange={(e) => go({ dir: e.target.value, page: 1 })}>
                    <option value="semua">Masuk &amp; keluar</option>
                    <option value="masuk">Uang masuk</option>
                    <option value="keluar">Uang keluar</option>
                </select>
                <select className={sel} value={filters.method} onChange={(e) => go({ method: e.target.value, page: 1 })}>
                    <option value="semua">Online &amp; manual</option>
                    <option value="online">Online</option>
                    <option value="manual">Manual</option>
                </select>
                <select className={sel} value={filters.status} onChange={(e) => go({ status: e.target.value, page: 1 })}>
                    <option value="lunas">Lunas</option>
                    <option value="menunggu">Menunggu</option>
                    <option value="gagal">Gagal</option>
                    <option value="dikembalikan">Dikembalikan</option>
                    <option value="semua">Semua status</option>
                </select>
            </div>

            {rows.length === 0 ? (
                <div className={'flex flex-col items-center gap-2 rounded-2xl px-4 py-8 text-center ' + CARD}>
                    <Inbox className="h-7 w-7 text-slate-400" />
                    <p className="text-sm font-semibold">Belum ada transaksi</p>
                    <p className={'text-xs ' + MUTED}>Ubah tanggal atau filter untuk melihat transaksi lain.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((r) => (
                        <div key={r.code} className={'space-y-1.5 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="font-mono text-[13px] font-bold break-all">{r.code}</div>
                                    <div className={'text-xs ' + MUTED}>
                                        {show(r.at.slice(0, 10))} {r.at.slice(11)}
                                    </div>
                                </div>
                                <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ' + (STATUS[r.status]?.style ?? '')}>{STATUS[r.status]?.label ?? r.status}</span>
                            </div>
                            <div className="text-[13px] leading-snug">
                                <div className="font-medium break-words">{r.title}</div>
                                <div className={'text-xs break-words ' + MUTED}>{r.subtitle}</div>
                            </div>
                            <div className="flex items-end justify-between gap-3">
                                <div className={'text-xs capitalize ' + MUTED}>
                                    {TYPE[r.type] ?? r.type} · {r.method}
                                </div>
                                <div className={'text-base font-semibold tabular-nums ' + (r.dir === 'masuk' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                                    {r.dir === 'masuk' ? '+' : '-'}
                                    {rp(r.amount)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="transaksi" />
        </div>
    );
}
