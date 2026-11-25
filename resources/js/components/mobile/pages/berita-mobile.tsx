import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Newspaper, Search } from 'lucide-react';
import EmptyState from '../kit/empty-state';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Card = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null };
type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    items: Card[];
    q: string;
    setQ: (v: string) => void;
    total: number;
    from: number;
    to: number;
    links: PageLink[];
};

const nav = 'flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-slate-900 dark:text-white ' + CARD + ' ' + PRESS;

/** Daftar berita HP: cari, kartu foto 16:9, paginasi. Dibungkus PublicScreen oleh halamannya. */
export default function BeritaMobile({ items, q, setQ, total, from, to, links }: Props) {
    const prev = links.length > 1 ? links[0] : null;
    const next = links.length > 1 ? links[links.length - 1] : null;
    const searching = q.trim() !== '';

    return (
        <div className="space-y-4">
            <label className={'flex h-12 items-center gap-3 rounded-full px-4 ' + FIELD}>
                <Search className="size-5 shrink-0 text-indigo-600 dark:text-indigo-300" strokeWidth={1.75} />
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari judul atau ringkasan"
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                />
            </label>

            {items.length === 0 ? (
                <EmptyState icon={Newspaper} title={searching ? 'Berita tidak ditemukan' : 'Belum ada berita'} text={searching ? 'Coba kata kunci lain.' : 'Berita terbaru akan tampil di sini.'} />
            ) : (
                <>
                    <p className={'px-1 text-xs ' + MUTED}>{searching ? 'Menemukan ' + items.length + ' berita' : 'Menampilkan ' + from + '–' + to + ' dari ' + total + ' berita'}</p>
                    <div className="space-y-4">
                        {items.map((n) => (
                            <Link key={n.id} href={'/berita/' + n.slug} className={'block overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
                                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200 dark:bg-neutral-800">
                                    {n.cover_url ? (
                                        <img src={n.cover_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                            <Newspaper className="size-8" strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    {n.date && <p className={'text-[11px] font-medium ' + MUTED}>{n.date}</p>}
                                    <h3 className="mt-1 line-clamp-2 text-[16px] leading-snug font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                                    {n.summary && <p className={'mt-1.5 line-clamp-2 text-xs leading-relaxed ' + MUTED}>{n.summary}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {!searching && links.length > 3 && (
                <nav aria-label="Paginasi" className="flex items-center justify-between gap-3 pt-2">
                    {prev?.url ? (
                        <Link href={prev.url} className={nav}>
                            <ChevronLeft className="size-4" />
                            Sebelumnya
                        </Link>
                    ) : (
                        <span className={nav + ' opacity-40'}>
                            <ChevronLeft className="size-4" />
                            Sebelumnya
                        </span>
                    )}
                    {next?.url ? (
                        <Link href={next.url} className={nav}>
                            Berikutnya
                            <ChevronRight className="size-4" />
                        </Link>
                    ) : (
                        <span className={nav + ' opacity-40'}>
                            Berikutnya
                            <ChevronRight className="size-4" />
                        </span>
                    )}
                </nav>
            )}
        </div>
    );
}
