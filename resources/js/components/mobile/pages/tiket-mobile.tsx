import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import EmptyState from '../kit/empty-state';
import FeaturedSlot from './featured-slot';
import { LUX_CSS, MUTED, PRESS } from '../kit/soft';

export type MobileTicket = {
    id: number;
    series?: boolean;
    title: string;
    poster: string | null;
    starts_at: string;
    ends_at: string;
    location: string;
    ticket_name: string;
    price: number;
    available?: boolean;
    category?: string | null;
};

type Props = {
    rows: MobileTicket[] | null;
    list: MobileTicket[];
    total: number;
    onBuy: (id: number) => void;
};

const LEFT = ['aspect-[3/4]', 'aspect-[4/5]'];
const RIGHT = ['aspect-[4/5]', 'aspect-[3/4]'];

const rupiah = (n: number) => (n > 0 ? 'Rp ' + new Intl.NumberFormat('id-ID').format(n) : 'Gratis');

function Poster({ t, ratio, onBuy }: { t: MobileTicket; ratio: string; onBuy: (id: number) => void }) {
    const available = t.available ?? true;
    const date = t.ends_at && t.ends_at !== t.starts_at ? t.starts_at + ' – ' + t.ends_at : t.starts_at;

    return (
        <button type="button" onClick={() => onBuy(t.id)} className={'block w-full text-left ' + PRESS}>
            <div className={'relative w-full overflow-hidden rounded-3xl bg-slate-200 dark:bg-neutral-800 ' + ratio}>
                {t.poster ? (
                    <img src={t.poster} alt={t.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Ticket className="size-8" strokeWidth={1.5} />
                    </div>
                )}
                <span
                    className={
                        'absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                        (available ? 'bg-white/90 text-emerald-700' : 'bg-white/90 text-slate-500')
                    }
                >
                    <span className={'size-1.5 rounded-full ' + (available ? 'bg-emerald-500' : 'bg-slate-400')} />
                    {available ? 'Tersedia' : 'Habis'}
                </span>
                {t.series && (
                    <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">Rangkaian</span>
                )}
            </div>
            <h3 className="mt-2 line-clamp-2 px-1 text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
            <p className={'mt-0.5 flex items-center gap-1 px-1 text-xs ' + MUTED}>
                <CalendarDays className="size-3 shrink-0" />
                <span className="line-clamp-1">{date}</span>
            </p>
            <p className={'flex items-center gap-1 px-1 text-xs ' + MUTED}>
                <MapPin className="size-3 shrink-0" />
                <span className="line-clamp-1">{t.location}</span>
            </p>
            <p className="mt-1 px-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {rupiah(t.price)}
                <span className={'ml-1 text-[11px] font-normal ' + MUTED}>{t.ticket_name}</span>
            </p>
        </button>
    );
}

/** Daftar tiket HP: poster dua kolom, ketuk untuk membuka jendela beli. Dibungkus PublicScreen oleh halamannya. */
export default function TiketMobile({ rows, list, total, onBuy }: Props) {
    if (rows === null) return <p className={'py-16 text-center text-sm ' + MUTED}>Memuat tiket...</p>;

    if (list.length === 0) {
        return (
            <EmptyState
                icon={Ticket}
                title={total === 0 ? 'Belum ada tiket dijual' : 'Tidak ada tiket yang cocok'}
                text={total === 0 ? 'Event dengan penjualan tiket yang dibuka akan muncul di sini.' : 'Coba kata kunci atau kategori lain.'}
            />
        );
    }

    const left = list.filter((_, i) => i % 2 === 0);
    const right = list.filter((_, i) => i % 2 === 1);

    return (
        <div className="space-y-4 pb-4">
            <style>{LUX_CSS}</style>
            <p className={'px-1 text-xs ' + MUTED}>Menampilkan {list.length} dari {total} event</p>
            <div className="grid grid-cols-2 items-start gap-3">
                <div className="space-y-4">
                    {left.map((t, i) => (
                        <Poster key={t.id} t={t} ratio={LEFT[i % 2]} onBuy={onBuy} />
                    ))}
                </div>
                <div className="space-y-4">
                    <FeaturedSlot />
                    {right.map((t, i) => (
                        <Poster key={t.id} t={t} ratio={RIGHT[(i + 1) % 2]} onBuy={onBuy} />
                    ))}
                </div>
            </div>
        </div>
    );
}
