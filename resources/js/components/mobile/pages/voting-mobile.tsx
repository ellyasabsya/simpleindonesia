import { BookOpen, Search, Vote } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EventCard } from '@/components/landing/event-section';
import EmptyState from '../kit/empty-state';
import PosterCard from '../kit/poster-card';
import { Row, Section } from '../kit/section';
import Sheet from '../kit/sheet';

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
const nf = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const KEY = { buka: 'berlangsung', segera: 'segera', tutup: 'selesai' } as const;

const STEPS: [string, string][] = [
    ['Pilih event', 'Buka daftar E-Voting, lalu pilih event yang voting-nya sedang dibuka.'],
    ['Pilih peserta voting favorit', 'Masuk ke arena, lihat peringkat, lalu tekan Beli Vote pada regu atau peserta yang ingin Anda dukung.'],
    ['Atur dukunganmu', 'Isi nama, tulis pesan dukungan (jika diaktifkan), pilih gift atau atur jumlah vote sendiri.'],
    ['Bayar dan pantau', 'Selesaikan pembayaran. Setelah berhasil diverifikasi, vote masuk ke peringkat dan tampil di daftar dukungan langsung.'],
];

const chip = (active: boolean) =>
    'inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition active:scale-95 ' +
    (active
        ? 'bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-900/25'
        : 'bg-white text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200');

/** Daftar E-Voting HP: panduan, cari, chip kategori, grid poster. Dibungkus PublicScreen oleh halamannya. */
export default function VotingMobile({ items }: { items: VotingItem[] }) {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [guide, setGuide] = useState(false);

    const cats = useMemo(() => {
        const m = new Map<string, { label: string; n: number }>();
        items.forEach((i) => {
            if (i.category_key) m.set(i.category_key, { label: i.category ?? i.category_key, n: (m.get(i.category_key)?.n ?? 0) + 1 });
        });
        return [...m.entries()];
    }, [items]);

    const list = items.filter((i) => (!cat || i.category_key === cat) && (i.title + ' ' + (i.location ?? '')).toLowerCase().includes(q.toLowerCase()));
    const totalParticipants = items.reduce((a, i) => a + i.participants, 0);

    const asCard = (v: VotingItem): EventCard => ({
        id: v.id,
        slug: null,
        title: v.title,
        poster: v.poster,
        category: v.category,
        category_key: v.category_key,
        location: v.location,
        organizer: v.organizer,
        starts_at: null,
        ends_at: v.ends,
        status: { key: KEY[v.status.key], label: v.status.label },
    });

    return (
        <div className="space-y-5">
            <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
                {items.length} event · {nf(totalParticipants)} peserta voting
            </p>

            <Section>
                <Row icon={BookOpen} label="Cara vote favoritmu" sub="Lihat panduan 4 langkah" onClick={() => setGuide(true)} />
            </Section>

            <label className="flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.3)] dark:bg-white/10">
                <Search className="size-5 shrink-0 text-slate-400" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari event atau lokasi" className="w-full bg-transparent text-base outline-none placeholder:text-slate-400" />
            </label>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                <button type="button" onClick={() => setCat('')} className={chip(!cat)}>Semua ({items.length})</button>
                {cats.map(([k, c]) => (
                    <button key={k} type="button" onClick={() => setCat(k)} className={chip(cat === k)}>{c.label} ({c.n})</button>
                ))}
            </div>

            {list.length === 0 ? (
                <EmptyState icon={Vote} title={items.length === 0 ? 'Belum ada voting' : 'Tidak ada yang cocok'} text={items.length === 0 ? 'Voting yang dibuka akan tampil di sini.' : 'Coba kata kunci atau kategori lain.'} />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {list.map((v) => (
                        <PosterCard key={v.id} compact event={asCard(v)} href={'/voting/' + v.id} note={rp(v.price) + '/vote'} className="w-full" />
                    ))}
                </div>
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
