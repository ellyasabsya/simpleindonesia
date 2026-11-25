import { router } from '@inertiajs/react';
import { CheckCircle2, Clock, FileText, Inbox, Search, Ticket, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

type Order = {
    id: number; code: string; buyer_name: string; buyer_email: string; buyer_phone: string; quantity: number;
    subtotal: number; fee: number; total: number; status: string; event_title: string; type_name: string;
    proof: { url: string; is_pdf: boolean } | null; created_at: string;
};
type Counts = { menunggu_verifikasi: number; lunas: number; batal: number; menunggu: number };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;

const STATUS: Record<string, { label: string; style: string }> = {
    menunggu_verifikasi: { label: 'Perlu verifikasi', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    lunas: { label: 'Lunas', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    batal: { label: 'Dibatalkan', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
    menunggu: { label: 'Belum bayar', style: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
};

type Props = { orders: Order[]; status: string; q: string; counts: Counts; pg: Pg };

export default function PesananTiketAdminMobile({ orders, status, q, counts, pg }: Props) {
    const [search, setSearch] = useState(q);
    const [busy, setBusy] = useState<number | null>(null);
    const [zoom, setZoom] = useState<string | null>(null);

    const totalAll = counts.menunggu_verifikasi + counts.lunas + counts.batal + counts.menunggu;
    const tabs = [
        { key: 'menunggu_verifikasi', label: 'Perlu verifikasi', n: counts.menunggu_verifikasi },
        { key: 'lunas', label: 'Lunas', n: counts.lunas },
        { key: 'batal', label: 'Dibatalkan', n: counts.batal },
        { key: 'menunggu', label: 'Belum bayar', n: counts.menunggu },
        { key: 'all', label: 'Semua', n: totalAll },
    ];
    const activeLabel = tabs.find((t) => t.key === status)?.label ?? 'Semua';

    const tiles = [
        { key: 'menunggu_verifikasi', label: 'Perlu verifikasi', n: counts.menunggu_verifikasi, color: 'text-amber-600 dark:text-amber-300', icon: Clock },
        { key: 'lunas', label: 'Lunas', n: counts.lunas, color: 'text-emerald-600 dark:text-emerald-300', icon: CheckCircle2 },
        { key: 'batal', label: 'Dibatalkan', n: counts.batal, color: 'text-rose-600 dark:text-rose-300', icon: XCircle },
        { key: 'menunggu', label: 'Belum bayar', n: counts.menunggu, color: 'text-slate-500 dark:text-slate-300', icon: Ticket },
    ] as const;

    const go = (params: Record<string, string>) =>
        router.get('/admin/pesanan-tiket', { status, q: search, ...params }, { preserveState: true, replace: true });

    const act = (o: Order, a: 'setujui' | 'tolak') => {
        let reason = '';
        if (a === 'tolak') {
            const r = window.prompt(`Tolak pesanan ${o.code}? Kuota tiket akan dilepas.\n\nTulis alasan untuk pembeli (contoh: bukti buram, nominal tidak sesuai):`, '');
            if (r === null) return;
            reason = r.trim();
        }
        router.patch(`/admin/pesanan-tiket/${o.id}/${a}`, a === 'tolak' ? { reason } : {}, {
            preserveScroll: true,
            onStart: () => setBusy(o.id),
            onFinish: () => setBusy(null),
        });
    };

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Verifikasi Tiket</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Cek bukti transfer pembeli, lalu setujui. Tiket QR otomatis dikirim ke email pembeli setelah disetujui.
                </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
                {tiles.map(({ key, label, n, color, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => go({ status: key })}
                        className={'flex flex-col gap-1 rounded-2xl px-3 py-2.5 text-left ' + CARD + (status === key ? ' ring-2 ring-indigo-400/60' : '')}
                    >
                        <span className={'flex items-center justify-between text-xs font-medium ' + MUTED}>
                            {label} <Icon className={'h-4 w-4 ' + color} />
                        </span>
                        <span className={'text-lg leading-none font-semibold tabular-nums ' + color}>{n}</span>
                    </button>
                ))}
            </div>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {tabs.map((t) => {
                    const active = status === t.key;
                    const alert = t.key === 'menunggu_verifikasi' && t.n > 0;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => go({ status: t.key })}
                            className={
                                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                                (active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                            }
                        >
                            {t.label}
                            <span className={'rounded-full px-1.5 text-[11px] font-bold ' + (active ? 'bg-white/25 text-white' : alert ? 'bg-amber-100 text-amber-800' : 'bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
                                {t.n}
                            </span>
                        </button>
                    );
                })}
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: search });
                }}
                className="flex items-center gap-2"
            >
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kode, nama, email, event"
                        className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                    />
                </div>
                <button type="submit" className="h-10 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
                    Cari
                </button>
            </form>

            {orders.length === 0 ? (
                <div className={'flex flex-col items-center rounded-2xl px-4 py-8 text-center ' + CARD}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{status === 'all' ? 'Belum ada pesanan.' : `Tidak ada pesanan dengan status "${activeLabel}".`}</p>
                    {status !== 'all' && totalAll > 0 && (
                        <>
                            <p className={'mt-1 text-xs ' + MUTED}>Ada {totalAll} pesanan di status lain.</p>
                            <button type="button" onClick={() => go({ status: 'all' })} className="mt-3 h-10 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white">
                                Tampilkan semua
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.map((o) => {
                        const st = STATUS[o.status] ?? STATUS.menunggu;
                        return (
                            <div key={o.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-mono text-[13px] font-bold break-all">{o.code}</div>
                                        <div className={'text-xs ' + MUTED}>{o.created_at}</div>
                                    </div>
                                    <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ' + st.style}>{st.label}</span>
                                </div>

                                <div className="text-[13px] leading-snug">
                                    <div className="font-semibold">{o.buyer_name}</div>
                                    <div className={'text-xs break-all ' + MUTED}>{o.buyer_email}</div>
                                    <div className={'text-xs ' + MUTED}>{o.buyer_phone}</div>
                                </div>

                                <div className="text-[13px] leading-snug">
                                    <div className="font-medium break-words">{o.event_title}</div>
                                    <div className={'text-xs ' + MUTED}>
                                        {o.type_name} × {o.quantity}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-base font-semibold text-indigo-600 tabular-nums dark:text-indigo-300">{rp(o.total)}</div>
                                        <div className={'text-[11px] ' + MUTED}>layanan {rp(o.fee)}</div>
                                    </div>
                                    {o.proof ? (
                                        o.proof.is_pdf ? (
                                            <a href={o.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                                                <FileText className="h-4 w-4" /> Bukti PDF
                                            </a>
                                        ) : (
                                            <button type="button" onClick={() => setZoom(o.proof!.url)} className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                                Lihat bukti
                                                <span className="block h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
                                                    <img loading="lazy" decoding="async" src={o.proof.url} alt="Bukti transfer" className="h-full w-full object-cover" />
                                                </span>
                                            </button>
                                        )
                                    ) : (
                                        <span className="text-xs text-slate-400">Tanpa bukti</span>
                                    )}
                                </div>

                                {o.status === 'menunggu_verifikasi' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" disabled={busy === o.id} onClick={() => act(o, 'setujui')} className="h-10 rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60">
                                            {busy === o.id ? '...' : 'Setujui'}
                                        </button>
                                        <button type="button" disabled={busy === o.id} onClick={() => act(o, 'tolak')} className="h-10 rounded-full border border-rose-300 text-sm font-semibold text-rose-600 disabled:opacity-60">
                                            Tolak
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="pesanan" />

            {zoom && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setZoom(null)}>
                    <button type="button" aria-label="Tutup" className="absolute top-5 right-5 rounded-full bg-white/90 p-2 text-slate-700">
                        <X className="h-5 w-5" />
                    </button>
                    <img src={zoom} alt="Bukti transfer" className="max-h-[90vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
