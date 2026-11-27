import { CalendarDays, Check, MapPin, QrCode, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import EmptyState from '../kit/empty-state';
import { CARD, FIELD, MUTED, PAGE, PRESS } from '../kit/soft';

type Holder = { code: string; holder_name: string; checked_in: boolean };
type Row = {
    id: number; code: string; quantity: number; total_price: number; status: string;
    title: string | null; location: string | null; starts_at: string | null; poster?: string | null;
};
type Item = { r: Row; h: Holder; index: number; total: number };
type Group = { r: Row; list: Item[] };

const day = (d: string | null) => (d ? new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '-');
const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

function TicketCard({ r, h, index, total }: Item) {
    return (
        <article className={'relative overflow-hidden rounded-3xl ' + CARD}>
            <div className="flex gap-3.5 p-4">
                <span className={'relative flex aspect-[4/5] w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-slate-500 ' + FIELD}>
                    {r.poster ? <img src={r.poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : <Ticket className="size-6" strokeWidth={1.5} />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">E-Ticket · {index + 1} dari {total}</p>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium capitalize text-slate-600 dark:text-slate-300">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        {r.status}
                    </span>
                    <h2 className="mt-1 line-clamp-2 text-[17px] leading-snug font-semibold tracking-tight text-slate-900 dark:text-white">{r.title ?? '(event dihapus)'}</h2>
                    <div className={'mt-1.5 space-y-0.5 text-xs ' + MUTED}>
                        <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" />{day(r.starts_at)}</p>
                        {r.location && <p className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{r.location}</span></p>}
                    </div>
                </div>
            </div>

            <div className="relative">
                <span aria-hidden className={'absolute -top-2 -left-2 size-4 rounded-full ' + PAGE} />
                <span aria-hidden className={'absolute -top-2 -right-2 size-4 rounded-full ' + PAGE} />
                <div className="mx-4 border-t border-dashed border-slate-900/15 dark:border-white/15" />
            </div>

            <div className="flex items-baseline gap-2 px-4 pt-3 pb-3">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">Pemegang</p>
                <p className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-white">{h.holder_name}</p>
            </div>

            <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-500 p-4 text-white">
                <div className="flex items-center gap-4">
                    <div className={'shrink-0 rounded-xl bg-white p-2 ' + (h.checked_in ? 'opacity-40 grayscale' : '')}>
                        <QRCodeSVG value={h.code} size={88} />
                    </div>
                    <div className="min-w-0 flex-1">
                        {h.checked_in ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium"><Check className="size-3" /> Sudah check-in</span>
                        ) : (
                            <p className="text-[13px] leading-snug font-medium">Tunjukkan QR saat check-in</p>
                        )}
                        <p className="mt-1.5 font-mono text-[11px] tracking-widest break-all text-white/70">{r.code}</p>
                    </div>
                </div>
                <a href={'/tiket/' + h.code} className={'mt-3.5 flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-medium whitespace-nowrap text-indigo-700 ' + PRESS}>
                    <QrCode className="size-4" /> Buka tiket
                </a>
            </div>
        </article>
    );
}

/** Tiket saya untuk HP: kartu tiket bersobekan, QR di panel indigo. */
export default function TiketKartuMobile({ groups, pending, empty, footer }: { groups: Group[]; pending: Row[]; empty: boolean; footer?: ReactNode }) {
    if (empty) {
        return <EmptyState icon={Ticket} title="Belum ada tiket" text="Tiket muncul di sini setelah pembayaran disetujui." />;
    }

    return (
        <div className="space-y-6 pb-24">
            <p className={'px-1 text-[13px] ' + MUTED}>Tunjukkan QR di pintu masuk.</p>

            {pending.map((r) => (
                <p key={r.id} className={'rounded-3xl p-4 text-center text-[13px] ' + FIELD + ' ' + MUTED}>
                    Tiket untuk pesanan <span className="font-mono font-semibold">{r.code}</span> sedang diproses.
                </p>
            ))}

            {groups.map((g) => (
                <section key={g.r.id + '-' + g.list[0].index} className="space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1 text-[13px]">
                        <p className={MUTED}>Pesanan <span className="ml-1 font-mono tracking-wider text-slate-900 dark:text-white">{g.r.code}</span></p>
                        <p className={'shrink-0 ' + MUTED}>{g.r.quantity} tiket · {rp(g.r.total_price)}</p>
                    </div>
                    {g.list.map((it) => <TicketCard key={it.h.code} {...it} />)}
                </section>
            ))}

            {footer}
        </div>
    );
}
