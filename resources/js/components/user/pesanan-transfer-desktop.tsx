import { router } from '@inertiajs/react';
import { Clock, Loader2, Upload, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PendingOrder } from '@/components/mobile/pages/pesanan-transfer-mobile';

const rp = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

function Card({ o }: { o: PendingOrder }) {
    const ref = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const rejected = o.status === 'ditolak';

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (ref.current) ref.current.value = '';
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
            setErr('Ukuran file maksimal 5 MB.');
            return;
        }
        setErr('');
        router.post('/tiket/pesanan/' + o.code + '/bukti', { payment_proof: f }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onError: (er) => setErr(er.payment_proof ?? 'Gagal mengirim bukti. Coba lagi.'),
        });
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/70 bg-white p-5 shadow-lg shadow-indigo-900/10 dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-lg font-bold leading-tight">{o.title ?? '(event dihapus)'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold tracking-wider text-slate-800 dark:text-white">{o.code}</span> · {o.quantity} tiket · {rp(o.total)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{o.created_at}</p>
                </div>
                <span className={'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ' + (rejected ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200')}>
                    {rejected ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {rejected ? 'Ditolak' : 'Menunggu verifikasi'}
                </span>
            </div>

            {rejected ? (
                <div className="space-y-3">
                    <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-white/10">
                        {o.reason ? 'Alasan: ' + o.reason : 'Bukti transfer belum dapat diterima.'}
                    </p>
                    <input ref={ref} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} onChange={pick} />
                    <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-800 disabled:opacity-60">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Kirim ulang bukti transfer
                    </button>
                    {err && <p className="text-sm text-red-600">{err}</p>}
                </div>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">Bukti transfer sedang diperiksa admin. Tiket muncul di sini dan dikirim ke email setelah disetujui.</p>
            )}
        </div>
    );
}

/** Pesanan transfer yang belum jadi tiket: menunggu verifikasi atau ditolak. Tidak tampil bila kosong. */
export default function PesananTransferDesktop({ orders }: { orders: PendingOrder[] }) {
    if (orders.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Pesanan transfer</h2>
            {orders.map((o) => <Card key={o.code} o={o} />)}
        </section>
    );
}
