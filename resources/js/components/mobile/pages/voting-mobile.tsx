import { BookOpen, CalendarDays, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Sheet from '../kit/sheet';
import { Row, Section } from '../kit/section';
import { usePlatform } from '../use-platform';

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
const dshort = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

const STATUS: Record<VotingItem['status']['key'], string> = {
    buka: 'bg-emerald-500 text-white',
    segera: 'bg-blue-600 text-white',
    tutup: 'bg-neutral-600 text-white',
};

const STEPS: [string, string][] = [
    ['Pilih event', 'Buka daftar E-Voting, lalu pilih event yang voting-nya sedang dibuka.'],
    ['Pilih peserta voting favorit', 'Masuk ke arena, lihat peringkat, lalu tekan Beli Vote pada regu atau peserta yang ingin Anda dukung.'],
    ['Atur dukunganmu', 'Isi nama, tulis pesan dukungan (jika diaktifkan), pilih gift atau atur jumlah vote sendiri.'],
    ['Bayar dan pantau', 'Selesaikan pembayaran. Setelah berhasil diverifikasi, vote masuk ke peringkat dan tampil di daftar dukungan langsung.'],
];

export default function VotingMobile({ items }: { items: VotingItem[] }) {
    const ios = usePlatform() === 'ios';
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

    const chip = (on: boolean) =>
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ' +
        (on
            ? 'bg-gradient-to-r from-indigo-800 to-violet-600 text-white shadow-md shadow-indigo-900/25'
            : 'border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200');
    const searchCls = ios
        ? 'flex h-10 items-center gap-2 rounded-[10px] bg-black/[0.06] px-3 dark:bg-white/10'
        : 'flex h-12 items-center gap-3 rounded-full border border-slate-300 bg-white px-4 dark:border-white/15 dark:bg-white/10';

    return (
        <main className={bp + ':hidden px-4 pt-24 pb-32'}>
            <h1 className={ios ? 'text-[34px] leading-tight font-bold text-black dark:text-white' : 'text-3xl font-semibold text-slate-900 dark:text-white'}>E-Voting</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {items.length} event · {nf(totalParticipants)} peserta voting
            </p>

            <div className="mt-4 space-y-4">
                <Section>
                    <Row icon={BookOpen} label="Cara vote favoritmu" sub="Lihat panduan 4 langkah" href={undefined} onClick={() => setGuide(true)} />
                </Section>

                <label className={searchCls}>
                    <Search className="size-4 shrink-0 text-slate-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari event atau lokasi"
                        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                </label>

                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                    <button type="button" onClick={() => setCat('')} className={chip(!cat)}>Semua ({items.length})</button>
                    {cats.map(([k, c]) => (
                        <button key={k} type="button" onClick={() => setCat(k)} className={chip(cat === k)}>{c.label} ({c.n})</button>
                    ))}
                </div>

                {list.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                        {items.length === 0 ? 'Belum ada voting yang dibuka.' : 'Tidak ada voting yang cocok.'}
                    </p>
                ) : (
                    <Section title={list.length + ' event tersedia'}>
                        {list.map((v) => (
                            <a key={v.id} href={'/voting/' + v.id} className="flex items-center gap-3 px-4 py-3 active:bg-black/5 dark:active:bg-white/10">
                                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                    {v.poster ? (
                                        <img src={v.poster} alt="" loading="lazy" className="size-full object-cover" />
                                    ) : (
                                        <span className="flex size-full items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-2xl font-bold text-white">{v.title.charAt(0).toUpperCase()}</span>
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 text-[15px] leading-snug font-bold text-slate-900 dark:text-white">{v.title}</span>
                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                        {v.location ? <MapPin className="size-3 shrink-0" /> : <CalendarDays className="size-3 shrink-0" />}
                                        <span className="truncate">{(v.location ? v.location + ' · ' : '') + 'sampai ' + dshort(v.ends)}</span>
                                    </span>
                                    <span className="mt-1.5 flex items-center gap-2">
                                        <span className={'rounded-full px-2 py-0.5 text-[11px] font-bold ' + STATUS[v.status.key]}>{v.status.label}</span>
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{rp(v.price)}/vote</span>
                                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                            {nf(v.participants)} peserta{v.votes !== null ? ' · ' + nf(v.votes) + ' vote' : ''}
                                        </span>
                                    </span>
                                </span>
                            </a>
                        ))}
                    </Section>
                )}
            </div>

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
        </main>
    );
}
