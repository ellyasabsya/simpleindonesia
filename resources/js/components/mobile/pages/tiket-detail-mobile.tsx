import { Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { CARD, MUTED, PRESS } from '../kit/soft';
import PublicScreen from '../public/public-screen';

export type TiketDetailData = {
    code: string;
    holder_name: string;
    checked_in: boolean;
    event_title: string;
    location: string | null;
    date: string;
    type_name: string;
};

/** Detail tiket untuk HP: kartu tiket dengan QR besar yang mudah dipindai di pintu masuk. */
export default function TiketDetailMobile({ ticket }: { ticket: TiketDetailData }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(ticket.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* abaikan */
        }
    };

    const rows: [string, string][] = [
        ['Pemegang', ticket.holder_name],
        ['Tanggal', ticket.date],
        ['Lokasi', ticket.location ?? '-'],
    ];

    return (
        <PublicScreen title="Tiket" back="/tiket-saya">
            <div className={'overflow-hidden rounded-3xl ' + CARD}>
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 px-5 py-5 text-white">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">{ticket.type_name}</p>
                    <h1 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight break-words">{ticket.event_title}</h1>
                </div>

                <div className="flex flex-col items-center px-5 py-6">
                    <div className="rounded-3xl bg-white p-4 ring-1 ring-black/10">
                        <QRCodeSVG value={ticket.code} size={200} level="M" />
                    </div>
                    <p className="mt-3 font-mono text-xs tracking-wider break-all text-slate-700 dark:text-slate-200">{ticket.code}</p>
                    <button
                        type="button"
                        onClick={copy}
                        className={'mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-slate-800 dark:text-slate-100 ' + CARD + ' ' + PRESS}
                    >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {copied ? 'Tersalin' : 'Salin kode'}
                    </button>
                    {ticket.checked_in && (
                        <p className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                            Sudah digunakan untuk check-in
                        </p>
                    )}
                </div>

                <div className="space-y-2.5 border-t border-dashed border-slate-300 px-5 py-4 dark:border-white/15">
                    {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-[13px]">
                            <span className={MUTED}>{k}</span>
                            <span className="text-right font-semibold break-words">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
            <p className={'px-1 text-center text-[11px] ' + MUTED}>Naikkan kecerahan layar saat memindai QR.</p>
        </PublicScreen>
    );
}
