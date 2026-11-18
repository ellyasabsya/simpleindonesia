import { Head } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';

type Tk = { code: string; holder_name: string; checked_in: boolean };
type O = { code: string; event_title: string; location: string | null; date: string; tickets: Tk[] };

export default function TiketSaya({ orders }: { orders: O[] }) {
    return (
        <>
            <Head title="Tiket Saya" />
            <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold">Tiket Saya</h1>
                    <a href="/dashboard" className="text-sm font-bold text-indigo-600">Kembali ke dashboard</a>
                </div>
                {orders.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
                        Belum ada tiket. Tiket muncul di sini setelah pembayaran disetujui.
                    </p>
                )}
                {orders.map((o) => (
                    <div key={o.code} className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs font-bold text-slate-500">{o.code}</p>
                        <h2 className="text-lg font-extrabold">{o.event_title}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{o.date} · {o.location ?? '-'}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {o.tickets.map((t) => (
                                <a key={t.code} href={`/tiket/${t.code}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-white/5">
                                    <div className="rounded-lg bg-white p-1.5"><QRCodeSVG value={t.code} size={72} /></div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold">{t.holder_name}</p>
                                        <p className="text-xs text-slate-500">{t.checked_in ? 'Sudah check-in' : 'Buka tiket'}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
