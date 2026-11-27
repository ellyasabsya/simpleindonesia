import { router } from '@inertiajs/react';
import { Clock, Loader2, Upload, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

export type PendingOrder = {
    code: string;
    title: string | null;
    quantity: number;
    total: number;
    status: 'menunggu_verifikasi' | 'ditolak';
    reason: string | null;
    created_at: string;
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

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
        <div className={'space-y-3 rounded-3xl p-4 ' + CARD}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{o.title ?? '(event dihapus)'}</p>
                    <p className={'text-xs ' + MUTED}>{o.code} · {o.quantity} tiket · {rp(o.total)}</p>
                    <p className={'text-xs ' + MUTED}>{o.created_at}</p>
                </div>
                <span className={'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ' + (rejected ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200')}>
                    {rejected ? <XCircle className="size-3.5" /> : <Clock className="size-3.5" />}
                    {rejected ? 'Ditolak' : 'Menunggu verifikasi'}
                </span>
            </div>

            {rejected ? (
                <>
                    <p className={'rounded-2xl px-4 py-3 text-[13px] leading-relaxed ' + FIELD}>
                        {o.reason ? 'Alasan: ' + o.reason : 'Bukti transfer belum dapat diterima.'}
                    </p>
                    <input ref={ref} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} onChange={pick} />
                    <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        Kirim ulang bukti transfer
                    </button>
                    {err && <p className="px-1 text-sm text-rose-600 dark:text-rose-400">{err}</p>}
                </>
            ) : (
                <p className={'text-[13px] leading-relaxed ' + MUTED}>Bukti transfer sedang diperiksa admin. Tiket muncul di sini dan dikirim ke email setelah disetujui.</p>
            )}
        </div>
    );
}

/** Pesanan transfer yang belum jadi tiket: menunggu verifikasi atau ditolak. Tidak tampil bila kosong. */
export default function PesananTransferMobile({ orders }: { orders: PendingOrder[] }) {
    if (orders.length === 0) return null;

    return (
        <section className="space-y-3">
            <h2 className="px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Pesanan transfer</h2>
            {orders.map((o) => <Card key={o.code} o={o} />)}
        </section>
    );
}
