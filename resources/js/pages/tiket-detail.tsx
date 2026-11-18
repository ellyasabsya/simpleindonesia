import { Head } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';

type T = { code: string; holder_name: string; checked_in: boolean; event_title: string; location: string | null; date: string; type_name: string };

export default function TiketDetail({ ticket }: { ticket: T }) {
    return (
        <>
            <Head title={`Tiket ${ticket.event_title}`} />
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-xl">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/70">{ticket.type_name}</p>
                        <h1 className="mt-1 text-xl font-extrabold">{ticket.event_title}</h1>
                    </div>
                    <div className="flex flex-col items-center px-6 py-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <QRCodeSVG value={ticket.code} size={208} level="M" />
                        </div>
                        <p className="mt-3 font-mono text-xs tracking-wider text-slate-500">{ticket.code}</p>
                        {ticket.checked_in && <p className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Sudah digunakan untuk check-in</p>}
                    </div>
                    <div className="space-y-2 border-t border-dashed border-slate-300 px-6 py-5 text-sm">
                        {([['Pemegang', ticket.holder_name], ['Tanggal', ticket.date], ['Lokasi', ticket.location ?? '-']] as const).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-bold">{v}</span></div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
