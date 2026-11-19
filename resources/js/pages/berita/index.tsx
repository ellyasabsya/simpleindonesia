import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Newspaper, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Footer from '@/components/landing/footer';
import Navbar from '@/components/landing/navbar';
import PageBackground from '@/components/page-background';

type Card = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null };
type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    news: { data: Card[]; links: PageLink[]; from?: number | null; to?: number | null; total?: number };
};

const idLabel = (s: string) => s.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya');

export default function BeritaIndex({ news }: Props) {
    const [q, setQ] = useState('');

    const items = useMemo(() => {
        const k = q.trim().toLowerCase();
        if (!k) return news.data;
        return news.data.filter((n) => `${n.title} ${n.summary ?? ''}`.toLowerCase().includes(k));
    }, [q, news.data]);

    const total = news.total ?? news.data.length;
    const from = news.from ?? (news.data.length ? 1 : 0);
    const to = news.to ?? news.data.length;

    return (
        <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
            <Head title="Semua Berita" />
            <style>{`@keyframes judulGradasi { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }`}</style>
            <PageBackground />
            <Navbar />
            <div className="relative z-10 pt-24">
                <main className="mx-auto w-full max-w-7xl px-6 pb-20">
                    <div className="pt-16">
                        <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500" />
                        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1
                                    className="bg-gradient-to-r from-rose-500 via-indigo-600 to-orange-500 bg-clip-text text-4xl font-semibold tracking-tight text-transparent uppercase"
                                    style={{ backgroundSize: '200% auto', animation: 'judulGradasi 6s ease-in-out infinite alternate' }}
                                >
                                    Semua Berita
                                </h1>
                                <p className="mt-4 text-xl text-slate-500 dark:text-slate-300">
                                    Kabar terbaru seputar event dan kegiatan di SIMPLE.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white px-5 py-3 text-base font-semibold shadow-sm dark:border-white/10 dark:bg-neutral-900">
                                <Newspaper className="h-6 w-6 text-orange-500" /> {total} berita
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 rounded-[2rem] border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/90">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari judul atau ringkasan berita..."
                                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pr-4 pl-14 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-neutral-900"
                            />
                        </div>
                    </div>

                    <p className="mt-10 text-lg font-medium text-slate-500 dark:text-slate-300">
                        {q.trim() ? `Menemukan ${items.length} berita` : `Menampilkan ${from}–${to} dari ${total} berita`}
                    </p>

                    {items.length === 0 ? (
                        <p className="mt-16 text-center text-slate-500">{q.trim() ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}</p>
                    ) : (
                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {items.map((n) => (
                                <Link
                                    key={n.id}
                                    href={`/berita/${n.slug}`}
                                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                        {n.cover_url ? (
                                            <img
                                                src={n.cover_url}
                                                alt=""
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                                <Newspaper className="size-12" />
                                            </div>
                                        )}
                                        {n.date && (
                                            <span className="absolute right-3 bottom-3 left-3 inline-flex items-center gap-2 rounded-2xl bg-black/70 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
                                                <CalendarDays className="h-5 w-5" /> {n.date}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-6">
                                        <h2 className="line-clamp-2 text-xl font-bold group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                                            {n.title}
                                        </h2>
                                        {n.summary && (
                                            <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{n.summary}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {news.links.length > 3 && (
                        <div className="mt-10 flex flex-wrap justify-center gap-1.5">
                            {news.links.map((l, i) =>
                                l.url ? (
                                    <Link
                                        key={i}
                                        href={l.url}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                            l.active
                                                ? 'bg-indigo-700 text-white'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: idLabel(l.label) }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="rounded-full px-4 py-2 text-sm text-slate-400"
                                        dangerouslySetInnerHTML={{ __html: idLabel(l.label) }}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
}
