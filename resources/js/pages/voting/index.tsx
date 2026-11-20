import { Head, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CalendarDays, MapPin, Search, Share2, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Footer from '@/components/landing/footer';
import PageBackground from '@/components/page-background';
import SiteNavbar from '@/components/site-navbar';
import VotingMobile from '@/components/mobile/pages/voting-mobile';

type Item = {
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

const glass = 'border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const nf = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const dshort = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

const STATUS: Record<Item['status']['key'], string> = {
    buka: 'bg-emerald-500 text-white',
    segera: 'bg-blue-600 text-white',
    tutup: 'bg-neutral-600 text-white',
};

const STEPS = [
    ['Pilih event', 'Buka daftar E-Voting, lalu pilih event yang voting-nya sedang dibuka.'],
    ['Pilih peserta voting favorit', 'Masuk ke arena, lihat peringkat, lalu tekan Beli Vote pada regu atau peserta yang ingin Anda dukung.'],
    ['Atur dukunganmu', 'Isi nama, tulis pesan dukungan (jika diaktifkan), pilih gift atau atur jumlah vote sendiri.'],
    ['Bayar dan pantau', 'Selesaikan pembayaran. Setelah berhasil diverifikasi, vote masuk ke peringkat dan tampil di daftar dukungan langsung.'],
];

function GuideModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
                <button type="button" aria-label="Tutup" onClick={onClose} className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200">
                    <X className="h-5 w-5" />
                </button>
                <div className="text-xs font-extrabold tracking-[0.3em] text-violet-600 uppercase">Panduan</div>
                <h2 className="mt-1 text-3xl font-extrabold">Cara Vote Favoritmu</h2>
                <ol className="mt-6 space-y-5">
                    {STEPS.map(([t, d], i) => (
                        <li key={t}>
                            <div className="font-extrabold">{i + 1}. {t}</div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">{d}</p>
                        </li>
                    ))}
                </ol>
                <button type="button" onClick={onClose} className="mt-7 w-full rounded-full border border-slate-200 py-3.5 text-sm font-extrabold hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5">Mengerti</button>
            </div>
        </div>
    );
}

function VotingCard({ v }: { v: Item }) {
    const [copied, setCopied] = useState(false);
    const url = `/voting/${v.id}`;

    const share = async () => {
        const full = `${window.location.origin}${url}`;
        try {
            if (navigator.share) await navigator.share({ title: v.title, url: full });
            else {
                await navigator.clipboard.writeText(full);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }
        } catch { /* dibatalkan */ }
    };

    return (
        <article className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <a href={url} className="relative block aspect-[5/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {v.poster ? (
                    <img src={v.poster} alt={v.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-6xl font-bold text-white/90">{v.title.charAt(0).toUpperCase()}</div>
                )}
                <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${STATUS[v.status.key]}`}>
                    <span className="size-2 rounded-full bg-white" /> {v.status.label}
                </span>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                    {v.location ? (
                        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                            <MapPin className="size-3.5 shrink-0" /><span className="truncate">{v.location}</span>
                        </span>
                    ) : <span />}
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                        <CalendarDays className="size-3.5" />{dshort(v.ends)}
                    </span>
                </div>
            </a>

            <div className="flex flex-1 flex-col p-5">
                <a href={url}><h3 className="line-clamp-2 text-xl leading-snug font-extrabold text-neutral-900 transition group-hover:text-blue-800 dark:text-white">{v.title}</h3></a>
                {v.organizer && <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500"><User className="size-4 shrink-0 text-violet-500" /><span className="line-clamp-1">{v.organizer}</span></p>}

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3.5 dark:bg-white/5">
                        <div className="text-[10px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">Peserta voting</div>
                        <div className="mt-1 text-2xl font-extrabold">{nf(v.participants)}</div>
                    </div>
                    {v.votes !== null && (
                        <div className="rounded-2xl bg-blue-50 p-3.5 dark:bg-blue-500/10">
                            <div className="text-[10px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">Vote</div>
                            <div className="mt-1 text-2xl font-extrabold text-blue-700 dark:text-blue-300">{nf(v.votes)}</div>
                        </div>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300">{rp(v.price)}<span className="text-sm font-bold">/vote</span></div>
                    <div className="flex items-center gap-2">
                        <a href={url} aria-label={`Masuk arena ${v.title}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-indigo-700 dark:bg-white dark:text-slate-900"><ArrowRight className="h-5 w-5" /></a>
                        <button type="button" onClick={share} aria-label="Bagikan" title={copied ? 'Tautan disalin' : 'Bagikan'} className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200">
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function VotingIndex() {
    const { items = [] } = usePage<{ items?: Item[] }>().props;
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [guide, setGuide] = useState(false);

    const cats = useMemo(() => {
        const m = new Map<string, { label: string; n: number }>();
        items.forEach((i) => { if (i.category_key) m.set(i.category_key, { label: i.category ?? i.category_key, n: (m.get(i.category_key)?.n ?? 0) + 1 }); });
        return [...m.entries()];
    }, [items]);

    const list = items.filter((i) => (!cat || i.category_key === cat) && `${i.title} ${i.location ?? ''}`.toLowerCase().includes(q.toLowerCase()));
    const totalParticipants = items.reduce((a, i) => a + i.participants, 0);

    const pill = (on: boolean) => `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${on ? 'bg-gradient-to-r from-indigo-800 to-violet-600 text-white shadow-md shadow-indigo-900/25' : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-800 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15'}`;
    const cnt = (on: boolean) => `rounded-full px-2 py-0.5 text-xs ${on ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`;

    return (
        <>
            <Head title="Semua Voting - SIMPLE" />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                <PageBackground />
                <SiteNavbar />
                <div className="relative z-10">
                    <VotingMobile items={items} />
                    <main className="hidden md:block mx-auto max-w-7xl px-6 pb-24 pt-32">
                        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500" />
                                <h1 className="title-gradient mt-5 text-3xl font-extrabold uppercase tracking-tight md:text-4xl">E-Voting</h1>
                                <p className="mt-4 max-w-2xl text-lg text-slate-600 md:text-xl dark:text-slate-300">Pilih event, lihat kandidat unggulan, dan dukung nominee favorit secara langsung.</p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <div className={`rounded-2xl px-6 py-4 ${glass}`}><div className="text-3xl font-extrabold">{items.length}</div><div className="mt-1 text-[11px] font-extrabold tracking-[0.25em] text-slate-500 uppercase">Event</div></div>
                                    <div className={`rounded-2xl px-6 py-4 ${glass}`}><div className="text-3xl font-extrabold">{nf(totalParticipants)}</div><div className="mt-1 text-[11px] font-extrabold tracking-[0.25em] text-slate-500 uppercase">Peserta voting</div></div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setGuide(true)} className={`flex w-full items-center justify-between gap-6 rounded-3xl p-5 text-left transition hover:-translate-y-0.5 md:w-80 ${glass}`}>
                                <span>
                                    <span className="block text-xs font-extrabold tracking-[0.3em] text-violet-600 uppercase">Panduan</span>
                                    <span className="mt-1 block text-xl font-extrabold">Lihat Panduan</span>
                                    <span className="block text-sm text-slate-500">Cara vote favoritmu</span>
                                </span>
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white"><BookOpen className="h-6 w-6" /></span>
                            </button>
                        </section>

                        <section className={`mt-10 flex flex-col gap-3 rounded-2xl p-3 lg:flex-row lg:items-center lg:gap-4 ${glass}`}>
                            <div className="relative w-full lg:max-w-sm">
                                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari event voting atau lokasi..." className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 pr-4 pl-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white" />
                            </div>
                            <div className="hidden h-6 w-px bg-slate-200 lg:block dark:bg-white/10" />
                            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-1 lg:pb-0 [scrollbar-width:none]">
                                <button type="button" onClick={() => setCat('')} className={pill(!cat)}>Semua <span className={cnt(!cat)}>{items.length}</span></button>
                                {cats.map(([k, c]) => (
                                    <button key={k} type="button" onClick={() => setCat(k)} className={pill(cat === k)}>{c.label} <span className={cnt(cat === k)}>{c.n}</span></button>
                                ))}
                            </div>
                        </section>

                        {list.length === 0 ? (
                            <p className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                                {items.length === 0 ? 'Belum ada voting yang dibuka.' : 'Tidak ada voting yang cocok.'}
                            </p>
                        ) : (
                            <>
                                <p className="mt-10 text-sm font-semibold text-slate-500 dark:text-slate-400">{list.length} event tersedia</p>
                                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {list.map((v) => <VotingCard key={v.id} v={v} />)}
                                </div>
                            </>
                        )}
                    </main>
                    <div className="hidden md:block"><Footer /></div>
                </div>
            </div>
            {guide && <GuideModal onClose={() => setGuide(false)} />}
        </>
    );
}
