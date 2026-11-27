import { BookOpen, CalendarDays, MapPin, Vote } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '../kit/empty-state';
import FeaturedSlot from './featured-slot';
import { eventRange } from '../kit/poster-card';
import Sheet from '../kit/sheet';
import { MUTED, PRESS } from '../kit/soft';

export type VotingItem = {
    id: number;
    title: string;
    poster: string | null;
    location: string | null;
    organizer: string | null;
    category_key: string | null;
    category: string | null;
    ends: string;
    participants: number;
    votes: number | null;
    price: number;
    status: { key: 'buka' | 'segera' | 'tutup'; label: string };
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const DOT = { buka: 'bg-emerald-400', segera: 'bg-sky-400', tutup: 'bg-neutral-400' } as const;

const STEPS: [string, string][] = [
    ['Pilih event', 'Buka daftar E-Voting, lalu pilih event yang voting-nya sedang dibuka.'],
    ['Pilih peserta voting favorit', 'Masuk ke arena, lihat peringkat, lalu tekan Beli Vote pada regu atau peserta yang ingin Anda dukung.'],
    ['Atur dukunganmu', 'Isi nama, tulis pesan dukungan (jika diaktifkan), pilih gift atau atur jumlah vote sendiri.'],
    ['Bayar dan pantau', 'Selesaikan pembayaran. Setelah berhasil diverifikasi, vote masuk ke peringkat dan tampil di daftar dukungan langsung.'],
];

function VoteCard({ v }: { v: VotingItem }) {
    const range = eventRange(null, v.ends);

    return (
        <a href={'/voting/' + v.id} className={'block ' + PRESS}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-200 dark:bg-neutral-800">
                {v.poster ? (
                    <>
                        
                        <img src={v.poster} alt={v.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Vote className="size-8" strokeWidth={1.5} />
                    </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-white/20">
                    <span className={'size-1.5 rounded-full ' + DOT[v.status.key]} />
                    {v.status.label}
                </span>
            </div>
            <div className="px-1 pt-2.5">
                <h3 className="line-clamp-2 text-base leading-snug font-semibold text-slate-900 dark:text-white">{v.title}</h3>
                {range && (
                    <p className={'mt-1 flex items-center gap-1.5 text-xs ' + MUTED}>
                        <CalendarDays className="size-3.5 shrink-0" />
                        {range}
                    </p>
                )}
                {v.location && (
                    <p className={'mt-0.5 flex min-w-0 items-center gap-1.5 text-xs ' + MUTED}>
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{v.location}</span>
                    </p>
                )}
                <p className="mt-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{rp(v.price)}/vote</p>
            </div>
        </a>
    );
}

/** Daftar E-Voting HP. Cari dan kategori ada di VotingBar (bar atas), disaring di sini. */
export default function VotingMobile({ items, q, cat }: { items: VotingItem[]; q: string; cat: string }) {
    const [guide, setGuide] = useState(false);

    const list = items.filter((i) => (!cat || i.category_key === cat) && (i.title + ' ' + (i.location ?? '')).toLowerCase().includes(q.toLowerCase()));
    const left = list.filter((_, i) => i % 2 === 0);
    const right = list.filter((_, i) => i % 2 === 1);

    return (
        <div className="space-y-4">
            {list.length === 0 ? (
                <EmptyState icon={Vote} title={items.length === 0 ? 'Belum ada voting' : 'Tidak ada yang cocok'} text={items.length === 0 ? 'Voting yang dibuka akan tampil di sini.' : 'Coba kata kunci atau kategori lain.'} />
            ) : (
                <>
                    <div className="flex items-center justify-between gap-3 px-1">
                        <p className={'text-xs ' + MUTED}>Menampilkan {list.length} dari {items.length} event</p>
                        <button type="button" onClick={() => setGuide(true)} className={'inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 ' + PRESS}>
                            <BookOpen className="size-3.5" />
                            Cara vote
                        </button>
                    </div>
                    <div className="grid grid-cols-2 items-start gap-3">
                        <div className="space-y-4">{left.map((v) => <VoteCard key={v.id} v={v} />)}</div>
                        <div className="space-y-4">
                            <FeaturedSlot />
                            {right.map((v) => <VoteCard key={v.id} v={v} />)}
                        </div>
                    </div>
                </>
            )}

            <Sheet open={guide} onClose={() => setGuide(false)} title="Cara Vote Favoritmu">
                <ol className="space-y-4 pb-2">
                    {STEPS.map(([t, d], i) => (
                        <li key={t}>
                            <div className="font-bold">{i + 1}. {t}</div>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{d}</p>
                        </li>
                    ))}
                </ol>
            </Sheet>
        </div>
    );
}
