import { Head, Link } from '@inertiajs/react';
import { Newspaper, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Footer from '@/components/landing/footer';
import PageBackground from '@/components/page-background';
import SiteNavbar from '@/components/site-navbar';
import BeritaMobile from '@/components/mobile/pages/berita-mobile';
import PublicScreen from '@/components/mobile/public/public-screen';
import { usePhone } from '@/components/mobile/use-phone';

type Card = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null };
type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    news: { data: Card[]; links: PageLink[]; from?: number | null; to?: number | null; total?: number };
};

const glass =
    'border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';

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
    const phone = usePhone();

    if (phone) {
        return (
            <>
                <Head title="Semua Berita - SIMPLE" />
                <PublicScreen title="Berita">
                    <BeritaMobile items={items} q={q} setQ={setQ} total={total} from={from} to={to} links={news.links} />
                </PublicScreen>
            </>
        );
    }

    const btn = 'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition';

    return (
        <>
            <Head title="Semua Berita - SIMPLE" />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                <PageBackground />
                <SiteNavbar />

                <div className="relative z-10">
                    <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
                        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500" />
                                <h1 className="title-gradient mt-5 text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
                                    Semua Berita
                                </h1>
                                <p className="mt-4 max-w-2xl text-lg text-slate-600 md:text-xl dark:text-slate-300">
                                    Kabar terbaru seputar event dan kegiatan di SIMPLE.
                                </p>
                            </div>
                            <span className={`inline-flex w-fit items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-100 ${glass}`}>
                                <Newspaper className="h-5 w-5 text-orange-500" />
                                {total} berita
                            </span>
                        </section>

                        <section className={`mt-10 flex flex-col gap-3 rounded-2xl p-3 lg:flex-row lg:items-center lg:gap-4 ${glass}`}>
                            <div className="relative w-full lg:max-w-sm">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Cari judul atau ringkasan berita..."
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
                                />
                            </div>
                        </section>

                        {items.length === 0 ? (
                            <p className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                                {q.trim() ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}
                            </p>
                        ) : (
                            <>
                                <p className="mt-10 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    {q.trim() ? `Menemukan ${items.length} berita` : `Menampilkan ${from}–${to} dari ${total} berita`}
                                </p>
                                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map((n) => (
                                        <Link
                                            key={n.id}
                                            href={`/berita/${n.slug}`}
                                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
                                        >
                                            <div className="aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                                {n.cover_url ? (
                                                    <img
                                                        src={n.cover_url}
                                                        alt=""
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                                        <Newspaper className="size-10" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col p-5">
                                                {n.date && <div className="text-xs text-neutral-500 dark:text-neutral-400">{n.date}</div>}
                                                <h3 className="mt-1 line-clamp-2 font-semibold group-hover:underline">{n.title}</h3>
                                                {n.summary && (
                                                    <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">{n.summary}</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}

                        {news.links.length > 3 && (
                            <nav aria-label="Paginasi" className="mt-12 flex flex-wrap items-center justify-center gap-2">
                                {news.links.map((l, i) =>
                                    l.url ? (
                                        <Link
                                            key={i}
                                            href={l.url}
                                            className={`${btn} ${
                                                l.active
                                                    ? 'bg-gradient-to-r from-indigo-800 to-violet-600 text-white shadow-lg shadow-indigo-900/30'
                                                    : `${glass} text-slate-700 hover:bg-white dark:text-slate-100`
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: idLabel(l.label) }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className={`${btn} text-slate-400 opacity-40`}
                                            dangerouslySetInnerHTML={{ __html: idLabel(l.label) }}
                                        />
                                    ),
                                )}
                            </nav>
                        )}
                    </main>
                    <Footer />
                </div>
            </div>
        </>
    );
}
