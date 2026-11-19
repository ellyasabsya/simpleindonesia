import { Link, usePage } from '@inertiajs/react';
import { Newspaper } from 'lucide-react';
import Section, { Placeholder } from './section';

type NewsCard = {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    cover_url: string | null;
    date: string | null;
};

export default function NewsSection() {
    const props = usePage().props as unknown as { latestNews?: NewsCard[] };
    const items = (props.latestNews ?? []).slice(0, 3);

    return (
        <Section
            id="berita"
            title="Berita"
            description="Kabar terbaru seputar event dan kegiatan di SIMPLE."
            href="/berita"
            linkLabel="Lihat Semua Berita"
        >
            {items.length === 0 ? (
                <Placeholder label="Belum ada berita." />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            )}
        </Section>
    );
}
