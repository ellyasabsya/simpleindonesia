import { router } from '@inertiajs/react';
import { Flag, MessageSquare } from 'lucide-react';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

type Status = 'reported' | 'all';

type Row = {
    id: number;
    body: string;
    author: string;
    author_email: string | null;
    event_title: string;
    event_key: string | null;
    type: 'event' | 'berita';
    source: string;
    url: string | null;
    dismiss_url: string;
    delete_url: string;
    created_at: string | null;
    reported_at: string | null;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    comments: { data: Row[]; from: number | null; to: number | null; total: number; last_page: number; links: PageLink[] };
    filters: { status: Status };
    counts: { reported: number; all: number };
};

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function KomentarAdminMobile({ comments, filters, counts }: Props) {
    const tabs: { key: Status; label: string; count: number }[] = [
        { key: 'reported', label: 'Dilaporkan', count: counts.reported },
        { key: 'all', label: 'Semua Komentar', count: counts.all },
    ];

    const goStatus = (status: Status) => router.get('/admin/komentar', { status }, { preserveScroll: true, preserveState: true, replace: true });

    const dismiss = (c: Row) => {
        if (window.confirm('Abaikan laporan pada komentar ini? Komentar tetap tampil.')) router.patch(c.dismiss_url, {}, { preserveScroll: true });
    };

    const remove = (c: Row) => {
        if (window.confirm('Hapus komentar ini secara permanen?')) router.delete(c.delete_url, { preserveScroll: true });
    };

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Moderasi Komentar</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Tinjau komentar event dan berita yang dilaporkan pengguna, lalu hapus atau abaikan laporannya.
                </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
                <div className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD}>
                    <p className={'flex items-center justify-between text-xs leading-snug font-medium ' + MUTED}>
                        Dilaporkan <Flag className="h-4 w-4 text-amber-600" />
                    </p>
                    <p className="text-lg leading-none font-semibold text-amber-600 tabular-nums dark:text-amber-300">{counts.reported}</p>
                </div>
                <div className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD}>
                    <p className={'flex items-center justify-between text-xs leading-snug font-medium ' + MUTED}>
                        Total <MessageSquare className="h-4 w-4 text-indigo-600" />
                    </p>
                    <p className="text-lg leading-none font-semibold text-indigo-600 tabular-nums dark:text-indigo-300">{counts.all}</p>
                </div>
            </div>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {tabs.map((t) => {
                    const active = filters.status === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => goStatus(t.key)}
                            className={
                                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                                (active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                            }
                        >
                            {t.label}
                            <span className={'rounded-full px-1.5 text-[11px] font-bold ' + (active ? 'bg-white/25 text-white' : 'bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>{t.count}</span>
                        </button>
                    );
                })}
            </div>

            {comments.data.length === 0 ? (
                <div className={'rounded-2xl px-4 py-8 text-center text-sm ' + CARD + ' ' + MUTED}>
                    {filters.status === 'reported' ? 'Tidak ada komentar yang dilaporkan.' : 'Belum ada komentar.'}
                </div>
            ) : (
                <div className="space-y-2">
                    {comments.data.map((c) => (
                        <div key={`${c.type}-${c.id}`} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={
                                        'rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                                        (c.type === 'berita' ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200' : 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200')
                                    }
                                >
                                    {c.source}
                                </span>
                                {c.reported_at ? (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">Dilaporkan</span>
                                ) : (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">Normal</span>
                                )}
                            </div>

                            <p className="text-[14px] leading-snug break-words whitespace-pre-line">{c.body}</p>

                            <div className="text-[13px] leading-snug">
                                <div className="font-semibold">{c.author}</div>
                                {c.author_email && <div className={'text-xs break-all ' + MUTED}>{c.author_email}</div>}
                                <div className={'text-xs ' + MUTED}>{c.created_at ? dateFmt.format(new Date(c.created_at)) : '-'}</div>
                            </div>

                            <div className="text-[13px] leading-snug">
                                {c.url ? (
                                    <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold break-words text-indigo-700 dark:text-indigo-300">
                                        {c.event_title}
                                    </a>
                                ) : (
                                    <span className="break-words">{c.event_title}</span>
                                )}
                            </div>

                            <div className={'grid gap-2 ' + (c.reported_at ? 'grid-cols-2' : 'grid-cols-1')}>
                                {c.reported_at && (
                                    <button type="button" onClick={() => dismiss(c)} className="h-10 rounded-full border border-slate-300 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                                        Abaikan
                                    </button>
                                )}
                                <button type="button" onClick={() => remove(c)} className="h-10 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className={'px-1 text-xs ' + MUTED}>
                Menampilkan {comments.from ?? 0}–{comments.to ?? 0} dari {comments.total} komentar
            </p>
            <Pagination current={Number(comments.links.find((l) => l.active)?.label ?? 1)} last={comments.last_page} total={comments.total} from={comments.from} to={comments.to} unit="komentar" />
        </div>
    );
}
