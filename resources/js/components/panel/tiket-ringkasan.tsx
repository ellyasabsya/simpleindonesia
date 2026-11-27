import { Clock, Receipt, Ticket, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

type Sum = {
    stats: { orders: number; tickets: number; revenue: number };
    counts: { menunggu: number; menunggu_verifikasi: number };
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-[11px] font-extrabold uppercase tracking-wider sm:text-xs text-slate-600 dark:text-slate-300';

type Tone = { Icon: LucideIcon; soft: string; text: string };
const tones: Record<'orders' | 'tickets' | 'revenue' | 'unpaid', Tone> = {
    orders: { Icon: Receipt, soft: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
    tickets: { Icon: Ticket, soft: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
    revenue: { Icon: Wallet, soft: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
    unpaid: { Icon: Clock, soft: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300' },
};

function Stat({ label, value, sub, accent, compact, tone }: { label: string; value: string; sub?: string; accent?: boolean; compact?: boolean; tone: Tone }) {
    if (compact) {
        return (
            <div className={`${card} min-w-0 p-3`}>
                <div className={lbl}>{label}</div>
                <div className={`mt-1 break-words text-lg font-semibold ${accent ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{value}</div>
                {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
            </div>
        );
    }
    const Icon = tone.Icon;
    return (
        <div title={sub} className={`group relative min-w-0 overflow-hidden rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${tone.soft}`}>
            <Icon className={`absolute -bottom-4 -right-3 h-24 w-24 opacity-10 transition group-hover:scale-110 ${tone.text}`} />
            <div className="relative">
                <div className={`break-words text-2xl font-extrabold sm:text-3xl ${tone.text}`}>{value}</div>
                <div className={`mt-1.5 text-sm font-bold ${tone.text}`}>{label}</div>
            </div>
        </div>
    );
}

/** Ringkasan umum menu Tiket: tampil di atas tab Jenis tiket dan Transaksi. */
export default function TiketRingkasan({ base, compact = false }: { base: string; compact?: boolean }) {
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
            <Stat compact={compact} tone={tones.orders} label="Pesanan lunas" value={d ? String(d.stats.orders) : dash} />
            <Stat compact={compact} tone={tones.tickets} label="Tiket terjual" value={d ? String(d.stats.tickets) : dash} />
            <Stat compact={compact} tone={tones.revenue} label="Penjualan lunas" value={d ? rp(d.stats.revenue) : dash} sub="Harga tiket, di luar biaya layanan" accent />
            <Stat compact={compact} tone={tones.unpaid} label="Belum lunas" value={waiting === null ? dash : String(waiting)} sub={d ? `${d.counts.menunggu_verifikasi} menunggu verifikasi` : undefined} />
        </div>
    );
}
