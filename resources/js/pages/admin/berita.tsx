import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, FileText, Newspaper, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';

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

const card = 'rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5';
const outlineBtn =
    'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20';

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Newspaper; tone: string }) {
    return (
        <div className={`${card} p-5`}>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {label} <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</div>
        </div>
    );
}

export default function BeritaIndex({ news, filters, counts }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    const visit = (status: string, search: string) =>
        router.get('/admin/berita', { q: search, status }, { preserveState: true, replace: true });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        visit(filters.status, q);
    };

    const remove = (row: Row) => {
        if (confirm(`Hapus berita "${row.title}"? Tindakan ini tidak bisa dibatalkan.`)) {
            router.delete(`/admin/berita/${row.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Berita">
            <Head title="Berita" />
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Konten
                            </span>
                            <h2 className="mt-3 text-2xl font-extrabold">Berita</h2>
                            <p className="mt-1 max-w-2xl text-sm text-white/80">
                                Kelola berita yang tampil di beranda dan halaman /berita.
                            </p>
                        </div>
                        <Link
                            href="/admin/berita/tambah"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                        >
                            <Plus className="h-4 w-4" /> Tambah berita
                        </Link>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <Stat label="Total Berita" value={counts.all} icon={Newspaper} tone="text-indigo-600" />
                    <Stat label="Terbit" value={counts.published} icon={CheckCircle2} tone="text-emerald-600" />
                    <Stat label="Draf" value={counts.draft} icon={FileText} tone="text-amber-600" />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        <form onSubmit={submit} className="relative min-w-[220px] flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari judul berita..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-slate-900 dark:text-white"
                            />
                        </form>
                        <div className="flex flex-wrap gap-1.5">
                            {TABS.map((t) => {
                                const active = filters.status === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => visit(t.key, q)}
                                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                                            active
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {t.label}
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                                active
                                                    ? 'bg-white/25 text-white'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                            }`}
                                        >
                                            {counts[t.count]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {news.data.length === 0 && (
                            <div className="px-4 py-14 text-center text-sm text-slate-500">Belum ada berita.</div>
                        )}
                        {news.data.map((row) => (
                            <div key={row.id} className="flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-slate-50/70 dark:hover:bg-white/5">
                                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/10">
                                    {row.cover_url ? (
                                        <img src={row.cover_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                            <Newspaper className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="line-clamp-2 font-semibold text-slate-800 dark:text-slate-100">{row.title}</div>
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                                        <span
                                            className={`rounded-full px-2.5 py-1 font-bold ${
                                                row.status === 'published'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                                            }`}
                                        >
                                            {row.status === 'published' ? 'Terbit' : 'Draf'}
                                        </span>
                                        <span>{row.date}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {row.status === 'published' && (
                                        <a href={`/berita/${row.slug}`} target="_blank" rel="noreferrer" className={outlineBtn}>
                                            Lihat
                                        </a>
                                    )}
                                    <Link href={`/admin/berita/${row.id}/ubah`} className={outlineBtn}>
                                        Ubah
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => remove(row)}
                                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {news.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1 border-t border-slate-200 px-4 py-3 dark:border-white/10">
                            {news.links.map((l, i) =>
                                l.url ? (
                                    <Link
                                        key={i}
                                        href={l.url}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                            l.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: l.label.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya'),
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="rounded-lg px-3 py-1.5 text-sm text-slate-400"
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
        </AdminLayout>
    );
}
