import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';


import type { ComponentProps } from 'react';
import Footer from '@/components/landing/footer';
import Navbar from '@/components/landing/navbar';
import PageBackground from '@/components/page-background';

type Article = {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    cover_url: string | null;
    date: string | null;
    html: string;
};
type Comment = { id: number; user_id: number; name: string; body: string; date: string | null };

const PROSE =
    '[&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold ' +
    '[&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-4 [&_p]:leading-7 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 ' +
    '[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline [&_strong]:font-semibold ' +
    '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:rounded-lg ' +
    '[&_hr]:my-6 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 dark:[&_code]:bg-gray-800';

function BeritaShowInner({
    news,
    comments,
    viewer,
}: {
    news: Article;
    comments: Comment[];
    viewer: { id: number } | null;
}) {
    const [url, setUrl] = useState('');
    const [copied, setCopied] = useState(false);
    useEffect(() => setUrl(window.location.href), []);

    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const text = encodeURIComponent(news.title);
    const u = encodeURIComponent(url);
    const share = [
        { label: 'WhatsApp', href: `https://wa.me/?text=${text}%20${u}` },
        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
        { label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${text}` },
    ];

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* abaikan */
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/berita/${news.slug}/komentar`, { preserveScroll: true, onSuccess: () => reset() });
    };

    const btn = 'rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800';

    return (
        <div className="mx-auto max-w-5xl p-6">
            <Head title={news.title} />
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
            <article className="rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 p-6 sm:p-10">
                <Link href="/berita" className="text-sm text-gray-500 hover:underline">
                    &larr; Semua berita
                </Link>
                <h1 className="mt-3 text-3xl font-bold leading-tight">{news.title}</h1>
                <div className="mt-2 text-sm text-gray-500">{news.date}</div>
                {news.cover_url && (
                    <img src={news.cover_url} alt="" className="mt-6 aspect-video w-full rounded-xl object-cover" />
                )}
                {news.summary && <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">{news.summary}</p>}

                <div className={`mt-6 ${PROSE}`} dangerouslySetInnerHTML={{ __html: news.html }} />

                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                    <span className="mr-1 text-sm font-medium">Bagikan:</span>
                    {share.map((s) => (
                        <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={btn}>
                            {s.label}
                        </a>
                    ))}
                    <button type="button" onClick={copy} className={btn}>
                        {copied ? 'Tersalin!' : 'Salin tautan'}
                    </button>
                </div>

                </article>
            <section className="rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 p-6 sm:p-8">
                    <h2 className="text-xl font-semibold">Komentar ({comments.length})</h2>

                    {viewer ? (
                        <form onSubmit={submit} className="mt-4">
                            <textarea
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="Tulis komentar..."
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                            />
                            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                            <button
                                type="submit"
                                disabled={processing || data.body.trim() === ''}
                                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Kirim
                            </button>
                        </form>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            <Link href="/login" className="text-blue-600 underline">
                                Masuk
                            </Link>{' '}
                            untuk menulis komentar.
                        </p>
                    )}

                    <div className="mt-6 space-y-4">
                        {comments.map((c) => (
                            <div key={c.id} className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-xs text-gray-500">{c.date}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm">{c.body}</p>
                                {viewer?.id === c.user_id && (
                                    <button
                                        type="button"
                                        className="mt-2 text-xs text-red-600 hover:underline"
                                        onClick={() => {
                                            if (confirm('Hapus komentar ini?')) {
                                                router.delete(`/berita/komentar/${c.id}`, { preserveScroll: true });
                                            }
                                        }}
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function BeritaShow(props: ComponentProps<typeof BeritaShowInner>) {
    return (
        <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
            <PageBackground />
            <Navbar />
            <div className="relative z-10 pt-24">
                <BeritaShowInner {...props} />
                <Footer />
            </div>
        </div>
    );
}
