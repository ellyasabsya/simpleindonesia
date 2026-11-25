import { Link, usePage } from '@inertiajs/react';

type Card = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null };

export default function NewsLatest() {
    const props = usePage().props as unknown as { latestNews?: Card[] };
    const items = props.latestNews ?? [];
    if (items.length === 0) return null;
    const [first, ...rest] = items;

    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
                <h2 className="text-2xl font-bold">Berita Terbaru</h2>
                <Link href="/berita" className="text-sm font-medium text-blue-600 hover:underline">
                    Lihat semua &rarr;
                </Link>
            </div>

            <Link
                href={`/berita/${first.slug}`}
                className="group grid overflow-hidden rounded-xl border border-gray-200 hover:shadow-md dark:border-gray-700 md:grid-cols-2"
            >
                <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                    {first.cover_url && <img src={first.cover_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-col justify-center p-6">
                    <div className="text-xs text-gray-500">{first.date}</div>
                    <h3 className="mt-1 text-xl font-semibold group-hover:underline">{first.title}</h3>
                    {first.summary && <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-400">{first.summary}</p>}
                </div>
            </Link>

            {rest.length > 0 && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {rest.map((n) => (
                        <Link
                            key={n.id}
                            href={`/berita/${n.slug}`}
                            className="group flex gap-4 rounded-xl border border-gray-200 p-3 hover:shadow-md dark:border-gray-700"
                        >
                            <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                {n.cover_url && <img loading="lazy" decoding="async" src={n.cover_url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs text-gray-500">{n.date}</div>
                                <h3 className="line-clamp-2 font-semibold group-hover:underline">{n.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
