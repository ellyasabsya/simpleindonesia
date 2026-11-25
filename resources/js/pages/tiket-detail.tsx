import { Head } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import TiketDetailMobile, { type TiketDetailData } from '@/components/mobile/pages/tiket-detail-mobile';

type T = TiketDetailData;

export default function TiketDetail({ ticket }: { ticket: T }) {
    return (
        <>
            <Head title={`Tiket ${ticket.event_title}`} />
            <div className="md:hidden">
                <TiketDetailMobile ticket={ticket} />
            </div>
            <div className="hidden md:block">
            <div className="flex min-h-screen items-center justify-center bg-[#f4f6fc] p-4 dark:bg-[#0a0c1a]">
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-900/[0.07] dark:bg-[#10132b] dark:text-white dark:ring-white/10">
                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 px-6 py-5 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{ticket.type_name}</p>
                        <h1 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight">{ticket.event_title}</h1>
                    </div>
                    <div className="flex flex-col items-center px-6 py-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <QRCodeSVG value={ticket.code} size={208} level="M" />
                        </div>
                        <p className="mt-3 font-mono text-xs tracking-wider text-slate-600 dark:text-slate-300">{ticket.code}</p>
                        {ticket.checked_in && <p className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Sudah digunakan untuk check-in</p>}
                    </div>
                    <div className="space-y-2 border-t border-dashed border-slate-300 px-6 py-5 text-sm dark:border-white/15">
                        {([['Pemegang', ticket.holder_name], ['Tanggal', ticket.date], ['Lokasi', ticket.location ?? '-']] as const).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4"><span className="text-slate-600 dark:text-slate-300">{k}</span><span className="text-right font-semibold">{v}</span></div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </>
    );
}
