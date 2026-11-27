import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, Flag, Link2, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import Button from '../kit/button';
import PublicScreen from '../public/public-screen';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Article = { id: number; title: string; slug: string; summary: string | null; cover_url: string | null; date: string | null; html: string };
type Comment = { id: number; user_id: number; name: string; body: string; date: string | null };

type Props = { news: Article; comments: Comment[]; viewer: { id: number } | null };

const PROSE =
    '[&_h1]:mt-6 [&_h1]:text-[22px] [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:text-[17px] [&_h2]:font-semibold ' +
    '[&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ' +
    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-700 [&_a]:underline dark:[&_a]:text-indigo-300 [&_strong]:font-semibold ' +
    '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-3 [&_img]:rounded-2xl ' +
    '[&_hr]:my-5 [&_code]:rounded [&_code]:bg-slate-900/[0.06] [&_code]:px-1 dark:[&_code]:bg-white/10';

const chip = 'inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-slate-800 dark:text-slate-100 ' + CARD + ' ' + PRESS;

/** Detail berita HP: sampul, judul, isi, bagikan, komentar. */
export default function BeritaShowMobile({ news, comments, viewer }: Props) {
    const [url, setUrl] = useState('');
    const [copied, setCopied] = useState(false);
    useEffect(() => setUrl(window.location.href), []);
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const text = encodeURIComponent(news.title);
    const u = encodeURIComponent(url);
    const share = [
        { label: 'WhatsApp', href: 'https://wa.me/?text=' + text + '%20' + u },
        { label: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + u },
        { label: 'X', href: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + text },
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
        if (processing || data.body.trim() === '') return;
        post('/berita/' + news.slug + '/komentar', { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <>
            <Head title={news.title} />
            <PublicScreen title="Berita" back="/berita">
                <article className="space-y-3">
                    {news.cover_url && <img src={news.cover_url} alt="" className="aspect-[16/9] w-full rounded-3xl object-cover" />}
                    {news.date && <p className={'px-1 text-[11px] font-medium ' + MUTED}>{news.date}</p>}
                    <h1 className="px-1 text-[22px] leading-tight font-semibold tracking-tight break-words">{news.title}</h1>
                    {news.summary && <p className={'px-1 text-base leading-relaxed ' + MUTED}>{news.summary}</p>}
                    <div className={'px-1 text-base break-words text-slate-800 dark:text-slate-100 ' + PROSE} dangerouslySetInnerHTML={{ __html: news.html }} />
                </article>

                <section className="space-y-2">
                    <h2 className="px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Bagikan</h2>
                    <div className="flex flex-wrap gap-2">
                        {share.map((s) => (
                            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={chip}>
                                {s.label}
                            </a>
                        ))}
                        <button type="button" onClick={copy} className={chip}>
                            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
                            {copied ? 'Tersalin' : 'Salin tautan'}
                        </button>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Komentar · {comments.length}</h2>
                    {viewer ? (
                        <form onSubmit={submit} className="space-y-2">
                            <textarea
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="Tulis komentar..."
                                className={'w-full resize-none rounded-3xl p-4 text-base outline-none ' + FIELD}
                            />
                            {errors.body && <p className="px-1 text-sm text-rose-600 dark:text-rose-400">{errors.body}</p>}
                            <div className="flex items-center justify-between px-1">
                                <span className={'text-xs ' + MUTED}>{data.body.length}/1000</span>
                                <Button onClick={() => submit({ preventDefault() {} } as FormEvent)}>Kirim</Button>
                            </div>
                        </form>
                    ) : (
                        <p className={'px-1 text-sm ' + MUTED}>
                            <Link href="/login" className="font-medium text-indigo-700 dark:text-indigo-300">
                                Masuk
                            </Link>{' '}
                            untuk menulis komentar.
                        </p>
                    )}

                    {comments.length === 0 ? (
                        <p className={'px-1 py-2 text-sm ' + MUTED}>Belum ada komentar.</p>
                    ) : (
                        <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                            {comments.map((c) => (
                                <div key={c.id} className="px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold">{c.name}</span>
                                        <span className={'shrink-0 text-xs ' + MUTED}>{c.date}</span>
                                        {viewer && viewer.id !== c.user_id && (
                                            <button
                                                type="button"
                                                onClick={() => confirm('Laporkan komentar ini ke admin?') && router.post('/berita/komentar/' + c.id + '/lapor', {}, { preserveScroll: true })}
                                                className={'ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ' + PRESS}
                                            >
                                                <Flag className="size-3.5" />
                                                Lapor
                                            </button>
                                        )}
                                        {viewer?.id === c.user_id && (
                                            <button
                                                type="button"
                                                aria-label="Hapus komentar"
                                                onClick={() => confirm('Hapus komentar ini?') && router.delete('/berita/komentar/' + c.id, { preserveScroll: true })}
                                                className={'ml-auto shrink-0 text-rose-600 dark:text-rose-400 ' + PRESS}
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-base leading-snug break-words whitespace-pre-line">{c.body}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </PublicScreen>
        </>
    );
}
