import { Head, Link, router } from '@inertiajs/react';
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
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Berita</h1>
                        <p className="text-sm text-gray-500">Kelola berita yang tampil di beranda dan halaman /berita.</p>
                    </div>
                    <Link
                        href="/admin/berita/tambah"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        + Tambah berita
                    </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={submit} className="flex-1 min-w-[220px]">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari judul berita..."
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                        />
                    </form>
                    <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => visit(t.key, q)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                                    filters.status === t.key
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                }`}
                            >
                                {t.label} ({counts[t.count]})
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                    {news.data.length === 0 && (
                        <div className="p-10 text-center text-sm text-gray-500">Belum ada berita.</div>
                    )}
                    {news.data.map((row) => (
                        <div key={row.id} className="flex flex-wrap items-center gap-4 p-4">
                            <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                {row.cover_url && <img src={row.cover_url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold">{row.title}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                    <span
                                        className={`rounded-full px-2 py-0.5 font-medium ${
                                            row.status === 'published'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        {row.status === 'published' ? 'Terbit' : 'Draf'}
                                    </span>
                                    <span>{row.date}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 text-sm">
                                {row.status === 'published' && (
                                    <a
                                        href={`/berita/${row.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                        Lihat
                                    </a>
                                )}
                                <Link
                                    href={`/admin/berita/${row.id}/ubah`}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Ubah
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => remove(row)}
                                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {news.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1">
                        {news.links.map((l, i) =>
                            l.url ? (
                                <Link
                                    key={i}
                                    href={l.url}
                                    preserveScroll
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
                                    className="rounded-md px-3 py-1.5 text-sm text-gray-400"
                                    dangerouslySetInnerHTML={{
                                        __html: l.label.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya'),
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
