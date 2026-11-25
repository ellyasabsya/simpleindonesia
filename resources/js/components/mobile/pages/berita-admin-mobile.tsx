import { Link, router } from '@inertiajs/react';
import { CheckCircle2, FileText, Newspaper, Plus, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CARD, MUTED } from '../kit/soft';

type Row = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    cover_url: string | null;
    date: string | null;
};
type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    news: { data: Row[]; links: PageLink[] };
    filters: { q: string; status: string };
    counts: { all: number; published: number; draft: number };
};

const TABS: { key: string; label: string; count: keyof Props['counts'] }[] = [
    { key: '', label: 'Semua', count: 'all' },
    { key: 'published', label: 'Terbit', count: 'published' },
    { key: 'draft', label: 'Draf', count: 'draft' },
];

const idLabel = (s: string) => s.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya');

export default function BeritaAdminMobile({ news, filters, counts }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    const visit = (status: string, search: string) => router.get('/admin/berita', { q: search, status }, { preserveState: true, replace: true });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        visit(filters.status, q);
    };

    const remove = (row: Row) => {
        if (confirm(`Hapus berita "${row.title}"? Tindakan ini tidak bisa dibatalkan.`)) {
            router.delete(`/admin/berita/${row.id}`, { preserveScroll: true });
        }
    };

    const tiles = [
        { label: 'Total Berita', n: counts.all, icon: Newspaper, tone: 'text-indigo-600 dark:text-indigo-300', wide: true },
        { label: 'Terbit', n: counts.published, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-300', wide: false },
        { label: 'Draf', n: counts.draft, icon: FileText, tone: 'text-amber-600 dark:text-amber-300', wide: false },
    ];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Berita</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">Kelola berita yang tampil di beranda dan halaman /berita.</p>
                <Link href="/admin/berita/tambah" className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-indigo-800">
                    <Plus className="h-4 w-4" /> Tambah berita
                </Link>
            </section>

            <div className="grid grid-cols-2 gap-2">
                {tiles.map(({ label, n, icon: Icon, tone, wide }) => (
                    <div key={label} className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD + (wide ? ' col-span-2' : '')}>
                        <p className={'flex items-center justify-between text-xs leading-snug font-medium ' + MUTED}>
                            {label} <Icon className={'h-4 w-4 ' + tone} />
                        </p>
                        <p className={'text-lg leading-none font-semibold tabular-nums ' + tone}>{n}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={submit} className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari judul berita..."
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </form>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {TABS.map((t) => {
                    const active = filters.status === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => visit(t.key, q)}
                            className={
                                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                                (active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                            }
                        >
                            {t.label}
                            <span className={'rounded-full px-1.5 text-[11px] font-bold ' + (active ? 'bg-white/25 text-white' : 'bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>{counts[t.count]}</span>
                        </button>
                    );
                })}
            </div>

            {news.data.length === 0 ? (
                <div className={'rounded-2xl px-4 py-8 text-center text-sm ' + CARD + ' ' + MUTED}>Belum ada berita.</div>
            ) : (
                <div className="space-y-2">
                    {news.data.map((row) => (
                        <div key={row.id} className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start gap-3">
                                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/10">
                                    {row.cover_url ? (
                                        <img loading="lazy" decoding="async" src={row.cover_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                            <Newspaper className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="line-clamp-2 text-[15px] leading-snug font-semibold">{row.title}</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs">
                                        <span
                                            className={
                                                'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' +
                                                (row.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200')
                                            }
                                        >
                                            {row.status === 'published' ? 'Terbit' : 'Draf'}
                                        </span>
                                        <span className={MUTED}>{row.date}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={'grid gap-2 ' + (row.status === 'published' ? 'grid-cols-3' : 'grid-cols-2')}>
                                {row.status === 'published' && (
                                    <a href={`/berita/${row.slug}`} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                                        Lihat
                                    </a>
                                )}
                                <Link href={`/admin/berita/${row.id}/ubah`} className="flex h-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                                    Ubah
                                </Link>
                                <button type="button" onClick={() => remove(row)} className="h-10 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {news.links.length > 3 && (
                <div className="-mx-1 flex items-center justify-center gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
                    {news.links.map((l, i) =>
                        l.url ? (
                            <Link
                                key={i}
                                href={l.url}
                                preserveScroll
                                className={
                                    'inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-3 text-[13px] font-semibold ' +
                                    (l.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                                }
                                dangerouslySetInnerHTML={{ __html: idLabel(l.label) }}
                            />
                        ) : (
                            <span key={i} className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center px-3 text-[13px] text-slate-400" dangerouslySetInnerHTML={{ __html: idLabel(l.label) }} />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
