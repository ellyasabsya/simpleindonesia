import { Head, Link } from '@inertiajs/react';


type Card = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null };
type PageLink = { url: string | null; label: string; active: boolean };

export default function BeritaIndex({ news }: { news: { data: Card[]; links: PageLink[] } }) {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <Head title="Berita" />
            <div className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="text-3xl font-bold">Berita</h1>
                <p className="mt-1 text-gray-500">Kabar terbaru seputar event dan kegiatan.</p>

                {news.data.length === 0 && <p className="mt-10 text-center text-gray-500">Belum ada berita.</p>}

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {news.data.map((n) => (
                        <Link
                            key={n.id}
                            href={`/berita/${n.slug}`}
                            className="group overflow-hidden rounded-xl border border-gray-200 hover:shadow-md dark:border-gray-700"
                        >
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                                {n.cover_url && (
                                    <img src={n.cover_url} alt="" className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div className="p-4">
                                <div className="text-xs text-gray-500">{n.date}</div>
                                <h2 className="mt-1 line-clamp-2 font-semibold group-hover:underline">{n.title}</h2>
                                {n.summary && <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{n.summary}</p>}
                            </div>
                        </Link>
                    ))}
                </div>

                {news.links.length > 3 && (
                    <div className="mt-8 flex flex-wrap justify-center gap-1">
                        {news.links.map((l, i) =>
                            l.url ? (
                                <Link
                                    key={i}
                                    href={l.url}
                                    className={`rounded-md px-3 py-1.5 text-sm ${
                                        l.active ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-700'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: l.label.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya'),
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-gray-400"
                                    dangerouslySetInnerHTML={{
                                        __html: l.label.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya'),
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
