import { useEffect, useState } from 'react';

type Sum = {
    stats: { orders: number; tickets: number; revenue: number };
    counts: { menunggu: number; menunggu_verifikasi: number };
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-[11px] font-extrabold uppercase tracking-wider sm:text-xs text-slate-600 dark:text-slate-300';

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
    return (
        <div className={`${card} min-w-0 p-4 sm:p-5`}>
            <div className={lbl}>{label}</div>
            <div className={`mt-2 break-words text-2xl font-extrabold sm:text-3xl ${accent ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{value}</div>
            {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
        </div>
    );
}

/** Ringkasan umum menu Tiket: tampil di atas tab Jenis tiket dan Transaksi. */
export default function TiketRingkasan({ base }: { base: string }) {
    const [d, setD] = useState<Sum | null>(null);

    useEffect(() => {
        const ctrl = new AbortController();
        fetch(`${base}/transaksi?per_page=10`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal: ctrl.signal,
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((j: Sum) => setD(j))
            .catch(() => {});
        return () => ctrl.abort();
    }, [base]);

    const dash = '-';
    const waiting = d ? d.counts.menunggu + d.counts.menunggu_verifikasi : null;

    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Stat label="Pesanan lunas" value={d ? String(d.stats.orders) : dash} />
            <Stat label="Tiket terjual" value={d ? String(d.stats.tickets) : dash} />
            <Stat label="Penjualan lunas" value={d ? rp(d.stats.revenue) : dash} sub="Harga tiket, di luar biaya layanan" accent />
            <Stat label="Belum lunas" value={waiting === null ? dash : String(waiting)} sub={d ? `${d.counts.menunggu_verifikasi} menunggu verifikasi` : undefined} />
        </div>
    );
}
