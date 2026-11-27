import { router } from '@inertiajs/react';
import { FileText, Inbox, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

type W = {
    id: number; institution: string; event: string; amount: number; bank_name: string; account_number: string; account_name: string;
    status: string; reject_reason: string | null; proof: { url: string; is_pdf: boolean } | null; requested_at: string; transferred_at: string | null;
};
type Bal = {
    id: number; title: string; institution: string; package: string; share_percent: number; subtotal: number; share: number;
    entitlement: number; transferred: number; processing: number; available: number;
    held?: number; release_at?: string | null;
};
type Summary = {
    total_paid: number; fee: number; share: number; package: number; package_count: number; platform: number;
    entitlement: number; transferred: number; processing: number; pending: number; available: number;
    mdr?: number; platform_net?: number; package_refunded?: number; package_refunded_count?: number; held?: number;
};
type Counts = { all: number; menunggu: number; disetujui: number; ditransfer: number; ditolak: number };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };
type Props = { tab: string; status: string; q: string; withdrawals: W[]; counts: Counts; summary: Summary; balances: Bal[]; pg: Pg };

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

const STATUS: Record<string, { label: string; style: string }> = {
    menunggu: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    disetujui: { label: 'Disetujui', style: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200' },
    ditransfer: { label: 'Ditransfer', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
};

function Line({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className={MUTED}>{k}</span>
            <span className={'text-right tabular-nums ' + (strong ? 'font-semibold ' : '') + (tone ?? '')}>{v}</span>
        </div>
    );
}

export default function PendapatanAdminMobile({ tab, status, q, withdrawals, counts, summary, balances, pg }: Props) {
    const [search, setSearch] = useState(q);
    const [busy, setBusy] = useState<number | null>(null);
    const [zoom, setZoom] = useState<string | null>(null);
    const [tf, setTf] = useState<W | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!tf) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [tf]);

    const go = (params: Record<string, string>) =>
        router.get('/admin/pendapatan', { tab, status, q: search, ...params }, { preserveState: true, replace: true });

    const patch = (w: W, a: 'setujui' | 'tolak') => {
        let data: Record<string, string> = {};
        if (a === 'tolak') {
            const reason = window.prompt(`Alasan menolak penarikan ${rp(w.amount)} dari ${w.institution}:`);
            if (!reason || !reason.trim()) return;
            data = { reason: reason.trim().slice(0, 300) };
        }
        router.patch(`/admin/penarikan/${w.id}/${a}`, data, {
            preserveScroll: true,
            onStart: () => setBusy(w.id),
            onFinish: () => setBusy(null),
        });
    };

    const submitTransfer = () => {
        if (!tf) return;
        if (!file) {
            setErr('Pilih file bukti transfer.');
            return;
        }
        router.post(`/admin/penarikan/${tf.id}/transfer`, { proof: file }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setBusy(tf.id),
            onFinish: () => setBusy(null),
            onSuccess: () => {
                setTf(null);
                setFile(null);
                setErr('');
            },
            onError: (e) => setErr(String(e.proof ?? Object.values(e)[0] ?? 'Gagal mengunggah bukti.')),
        });
    };

    const cards = [
        { label: 'Total dibayar pembeli', value: summary.total_paid, note: 'Tiket dan vote yang lunas', color: 'text-blue-700 dark:text-blue-300' },
        { label: 'Biaya layanan', value: summary.fee, note: 'Dibayar pembeli, di atas harga', color: 'text-violet-700 dark:text-violet-300' },
        { label: 'Bagi hasil paket', value: summary.share, note: 'Dipotong dari harga', color: 'text-fuchsia-700 dark:text-fuchsia-300' },
        { label: 'Pembayaran paket', value: summary.package, note: `${summary.package_count} paket lunas`, color: 'text-indigo-700 dark:text-indigo-300' },
        { label: 'Pendapatan platform', value: summary.platform, note: 'Layanan + bagi hasil + paket', color: 'text-rose-700 dark:text-rose-300' },
        { label: 'Hak penyelenggara', value: summary.entitlement, note: 'Harga dikurangi bagi hasil', color: 'text-emerald-700 dark:text-emerald-300' },
        { label: 'Sudah ditarik', value: summary.transferred, note: 'Sudah ditransfer', color: 'text-slate-800 dark:text-slate-100' },
        { label: 'Dalam proses', value: summary.processing, note: 'Disetujui, belum ditransfer', color: 'text-amber-700 dark:text-amber-300' },
        { label: 'Saldo tersedia', value: summary.available, note: 'Belum ditarik', color: 'text-cyan-700 dark:text-cyan-300' },
        { label: 'Dana ditahan', value: summary.held ?? 0, note: 'Menunggu masa tahan', color: 'text-orange-700 dark:text-orange-300' },
        { label: 'Biaya Midtrans (estimasi)', value: summary.mdr ?? 0, note: 'Dari jenis pembayaran', color: 'text-slate-700 dark:text-slate-200' },
        { label: 'Pendapatan bersih', value: summary.platform_net ?? summary.platform, note: 'Dikurangi biaya Midtrans', color: 'text-rose-700 dark:text-rose-300' },
        ...(summary.package_refunded
            ? [{ label: 'Paket dikembalikan', value: summary.package_refunded, note: `${summary.package_refunded_count ?? 0} paket di-refund`, color: 'text-slate-600 dark:text-slate-300' }]
            : []),
    ];

    const chips = [
        { key: 'all', label: 'Semua', n: counts.all },
        { key: 'menunggu', label: 'Menunggu', n: counts.menunggu },
        { key: 'disetujui', label: 'Disetujui', n: counts.disetujui },
        { key: 'ditransfer', label: 'Ditransfer', n: counts.ditransfer },
        { key: 'ditolak', label: 'Ditolak', n: counts.ditolak },
    ];

    const empty = (text: string) => (
        <div className={'flex flex-col items-center rounded-2xl px-4 py-8 text-center ' + CARD}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">{text}</p>
        </div>
    );

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Pendapatan &amp; Penarikan</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Pantau pembayaran tiket, biaya layanan, hak penyelenggara, dan proses permintaan penarikan dana.
                </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
                {cards.map((c) => {
                    const v = rp(c.value);
                    return (
                        <div key={c.label} className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD + (v.length > 12 ? ' col-span-2' : '')}>
                            <p className={'text-xs leading-snug font-medium ' + MUTED}>{c.label}</p>
                            <p className={'text-[17px] leading-none font-semibold tabular-nums ' + c.color}>{v}</p>
                            <p className={'text-[11px] leading-snug ' + MUTED}>{c.note}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-full bg-slate-100 p-1 dark:bg-white/10">
                {[{ k: 'penarikan', l: 'Penarikan' }, { k: 'saldo', l: 'Saldo per Event' }].map((t) => (
                    <button
                        key={t.k}
                        type="button"
                        onClick={() => go({ tab: t.k })}
                        className={'h-9 rounded-full text-[13px] font-semibold ' + (tab === t.k ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300')}
                    >
                        {t.l}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <a href={`/admin/pendapatan/csv?status=${status}&q=${encodeURIComponent(q)}`} className={'flex h-10 items-center justify-center rounded-full text-sm font-semibold ' + CARD}>
                    Unduh CSV
                </a>
                <a href="/admin/pendapatan/cetak" target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    Cetak Laporan
                </a>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: search });
                }}
            >
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tab === 'saldo' ? 'Cari lembaga atau event...' : 'Cari lembaga, event, bank, rekening...'}
                    className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </form>

            {tab === 'penarikan' && (
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                    {chips.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => go({ status: c.key })}
                            className={
                                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                                (status === c.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                            }
                        >
                            {c.label}
                            <span className={'rounded-full px-1.5 text-[11px] font-bold ' + (status === c.key ? 'bg-white/25 text-white' : 'bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>{c.n}</span>
                        </button>
                    ))}
                </div>
            )}

            {tab === 'saldo' ? (
                balances.length === 0 ? (
                    empty('Belum ada penjualan tiket yang lunas.')
                ) : (
                    <div className="space-y-2">
                        {balances.map((b) => (
                            <div key={b.id} className={'space-y-1.5 rounded-2xl p-3 ' + CARD}>
                                <div>
                                    <div className="text-base leading-snug font-semibold break-words">{b.title}</div>
                                    <div className={'text-xs ' + MUTED}>
                                        {b.institution} · Paket {b.package}
                                    </div>
                                </div>
                                <Line k="Penjualan tiket" v={rp(b.subtotal)} />
                                <Line k={`Bagi hasil${b.share_percent > 0 ? ` (${b.share_percent}%)` : ''}`} v={rp(b.share)} />
                                <Line k="Hak penyelenggara" v={rp(b.entitlement)} strong />
                                <Line k="Sudah ditarik" v={rp(b.transferred)} />
                                <Line k="Dalam proses" v={rp(b.processing)} tone="text-amber-700 dark:text-amber-300" />
                                <Line k="Saldo tersedia" v={rp(b.available)} strong tone="text-cyan-700 dark:text-cyan-300" />
                                {!!b.held && (
                                    <p className="text-[11px] text-orange-700 dark:text-orange-300">
                                        Ditahan {rp(b.held)}
                                        {b.release_at ? ` · cair ${new Date(b.release_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : withdrawals.length === 0 ? (
                empty(status === 'all' ? 'Belum ada permintaan penarikan.' : 'Tidak ada permintaan penarikan pada filter ini.')
            ) : (
                <div className="space-y-2">
                    {withdrawals.map((w) => {
                        const st = STATUS[w.status] ?? STATUS.menunggu;
                        return (
                            <div key={w.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-base leading-snug font-semibold break-words">{w.institution}</div>
                                        <div className={'text-xs break-words ' + MUTED}>{w.event}</div>
                                    </div>
                                    <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ' + st.style}>{st.label}</span>
                                </div>
                                <div className="flex items-end justify-between gap-3">
                                    <div className="text-base font-semibold text-indigo-600 tabular-nums dark:text-indigo-300">{rp(w.amount)}</div>
                                    <div className={'text-xs ' + MUTED}>{w.requested_at}</div>
                                </div>
                                <div className="text-[13px] leading-snug">
                                    <div className="font-medium">
                                        {w.bank_name} · {w.account_number}
                                    </div>
                                    <div className={'text-xs ' + MUTED}>a.n. {w.account_name}</div>
                                </div>
                                {w.status === 'ditolak' && w.reject_reason && <p className="text-xs text-rose-600 dark:text-rose-300">{w.reject_reason}</p>}
                                {w.status === 'ditransfer' && w.transferred_at && <p className={'text-xs ' + MUTED}>Ditransfer {w.transferred_at}</p>}

                                {w.status === 'menunggu' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" disabled={busy === w.id} onClick={() => patch(w, 'setujui')} className="h-10 rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60">
                                            {busy === w.id ? '...' : 'Setujui'}
                                        </button>
                                        <button type="button" disabled={busy === w.id} onClick={() => patch(w, 'tolak')} className="h-10 rounded-full border border-rose-300 text-sm font-semibold text-rose-600 disabled:opacity-60">
                                            Tolak
                                        </button>
                                    </div>
                                )}
                                {w.status === 'disetujui' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTf(w);
                                            setFile(null);
                                            setErr('');
                                        }}
                                        className="h-10 w-full rounded-full bg-indigo-600 text-sm font-semibold text-white"
                                    >
                                        Tandai ditransfer
                                    </button>
                                )}
                                {w.status === 'ditransfer' &&
                                    w.proof &&
                                    (w.proof.is_pdf ? (
                                        <a href={w.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                                            <FileText className="h-4 w-4" /> Bukti PDF
                                        </a>
                                    ) : (
                                        <button type="button" onClick={() => setZoom(w.proof!.url)} className="text-xs font-bold text-indigo-600 underline">
                                            Lihat bukti
                                        </button>
                                    ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === 'penarikan' && <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="permintaan" />}

            {tf &&
                createPortal(
                    <div className="fixed inset-0 z-[80]">
                        <div onClick={() => setTf(null)} className="absolute inset-0 bg-slate-900/50" />
                        <div role="dialog" aria-label="Tandai ditransfer" className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white">
                            <div className="flex justify-center pt-3">
                                <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                            </div>
                            <div className="overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                                <h3 className="text-[17px] font-semibold tracking-tight">Tandai sudah ditransfer</h3>
                                <p className={'mt-1 text-[13px] leading-snug ' + MUTED}>
                                    {rp(tf.amount)} ke {tf.bank_name} {tf.account_number} a.n. {tf.account_name}
                                </p>
                                <label className="mt-4 block text-[13px] font-semibold">Bukti transfer (JPG, PNG, WebP, atau PDF)</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                    onChange={(e) => {
                                        setFile(e.target.files?.[0] ?? null);
                                        setErr('');
                                    }}
                                    className="mt-2 block w-full text-sm"
                                />
                                {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setTf(null)} className="h-11 rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                        Batal
                                    </button>
                                    <button type="button" disabled={busy === tf.id} onClick={submitTransfer} className="h-11 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-60">
                                        {busy === tf.id ? 'Mengunggah...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}

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
