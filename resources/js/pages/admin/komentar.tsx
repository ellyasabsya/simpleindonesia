import { Link, router } from '@inertiajs/react';
import { Flag, MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';

type Status = 'reported' | 'all';

type Row = {
    id: number;
    body: string;
    author: string;
    author_email: string | null;
    event_title: string;
    event_key: string | null;
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
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Flag; tone: string }) {
    return (
        <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">{label}</span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">{value}</p>
        </div>
    );
}

export default function AdminKomentar({ comments, filters, counts }: Props) {
    const tabs: { key: Status; label: string; count: number }[] = [
        { key: 'reported', label: 'Dilaporkan', count: counts.reported },
        { key: 'all', label: 'Semua Komentar', count: counts.all },
    ];

    const dismiss = (c: Row) => {
        if (window.confirm('Abaikan laporan pada komentar ini? Komentar tetap tampil.'))
            router.patch(`/admin/komentar/${c.id}/abaikan`, {}, { preserveScroll: true });
    };

    const remove = (c: Row) => {
        if (window.confirm('Hapus komentar ini secara permanen?'))
            router.delete(`/admin/komentar/${c.id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Moderasi Komentar">
            <div className="grid gap-4 md:grid-cols-2">
                <Stat label="Komentar Dilaporkan" value={counts.reported} icon={Flag} tone="bg-amber-100 text-amber-700" />
                <Stat label="Total Komentar" value={counts.all} icon={MessageSquare} tone="bg-indigo-100 text-indigo-700" />
            </div>

            <section className={card}>
                <div className="p-5 lg:p-6">
                    <h2 className="text-xl font-extrabold">Daftar Komentar</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tinjau komentar yang dilaporkan pengguna, lalu hapus atau abaikan laporannya.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {tabs.map((t) => (
                            <Link
                                key={t.key}
                                href="/admin/komentar"
                                data={{ status: t.key }}
                                preserveScroll
                                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                                    filters.status === t.key
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-200'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                {t.label} <span className="ml-2 text-xs">{t.count}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-slate-50/80 text-xs tracking-widest text-slate-500 uppercase dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Komentar</th>
                                <th className="px-6 py-4">Penulis</th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {comments.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        {filters.status === 'reported' ? 'Tidak ada komentar yang dilaporkan.' : 'Belum ada komentar.'}
                                    </td>
                                </tr>
                            )}
                            {comments.data.map((c) => (
                                <tr key={c.id}>
                                    <td className="max-w-xs px-6 py-4">
                                        <p className="line-clamp-3 whitespace-pre-line break-words">{c.body}</p>
                                        <p className="mt-1 text-xs text-slate-500">{c.created_at ? dateFmt.format(new Date(c.created_at)) : '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{c.author}</p>
                                        <p className="text-xs text-slate-500">{c.author_email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.event_key ? (
                                            <a href={`/events/${c.event_key}`} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                                                {c.event_title}
                                            </a>
                                        ) : (
                                            c.event_title
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.reported_at ? (
                                            <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                                                Dilaporkan
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500">Normal</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {c.reported_at && (
                                                <button
                                                    onClick={() => dismiss(c)}
                                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                                                >
                                                    Abaikan
                                                </button>
                                            )}
                                            <button
                                                onClick={() => remove(c)}
                                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <span>
                        Menampilkan {comments.from ?? 0}–{comments.to ?? 0} dari {comments.total} komentar
                    </span>
                    {comments.last_page > 1 && (
                        <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                            {comments.links.map((link, idx) => {
                                const label = link.label
                                    .replace('&laquo;', '«')
                                    .replace('&raquo;', '»')
                                    .replace('Previous', 'Sebelumnya')
                                    .replace('Next', 'Berikutnya');
                                const cls = `rounded-lg border px-3 py-1.5 text-xs font-bold ${
                                    link.active
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200'
                                }`;
                                return link.url ? (
                                    <Link key={idx} href={link.url} preserveScroll className={cls}>
                                        {label}
                                    </Link>
                                ) : (
                                    <span key={idx} className={`${cls} opacity-40`}>
                                        {label}
                                    </span>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </section>
        </AdminLayout>
    );
}
