import { Link, router } from '@inertiajs/react';
import { Flag, MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

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
const card = 'rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5';
const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500';
const td = 'px-4 py-3.5 align-middle';

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Flag; tone: string }) {
    return (
        <div className={`${card} p-5`}>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {label} <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</div>
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
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Moderasi Konten
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold">Moderasi Komentar</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/80">
                            Tinjau komentar yang dilaporkan pengguna, lalu hapus atau abaikan laporannya.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Stat label="Komentar Dilaporkan" value={counts.reported} icon={Flag} tone="text-amber-600" />
                    <Stat label="Total Komentar" value={counts.all} icon={MessageSquare} tone="text-indigo-600" />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        {tabs.map((t) => {
                            const active = filters.status === t.key;
                            return (
                                <Link
                                    key={t.key}
                                    href="/admin/komentar"
                                    data={{ status: t.key }}
                                    preserveScroll
                                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                                        active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {t.label}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                            active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                        }`}
                                    >
                                        {t.count}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5">
                                <tr>
                                    <th className={th}>Komentar</th>
                                    <th className={th}>Penulis</th>
                                    <th className={th}>Event</th>
                                    <th className={th}>Status</th>
                                    <th className={`${th} text-right`}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {comments.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-14 text-center text-slate-500">
                                            {filters.status === 'reported' ? 'Tidak ada komentar yang dilaporkan.' : 'Belum ada komentar.'}
                                        </td>
                                    </tr>
                                )}
                                {comments.data.map((c) => (
                                    <tr key={c.id}>
                                        <td className={`${td} max-w-xs`}>
                                            <p className="line-clamp-3 break-words whitespace-pre-line text-slate-800 dark:text-slate-100">{c.body}</p>
                                            <p className="mt-1 text-xs text-slate-500">{c.created_at ? dateFmt.format(new Date(c.created_at)) : '-'}</p>
                                        </td>
                                        <td className={td}>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{c.author}</p>
                                            <p className="text-xs text-slate-500">{c.author_email}</p>
                                        </td>
                                        <td className={td}>
                                            {c.event_key ? (
                                                <a href={`/events/${c.event_key}`} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                                                    {c.event_title}
                                                </a>
                                            ) : (
                                                c.event_title
                                            )}
                                        </td>
                                        <td className={td}>
                                            {c.reported_at ? (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                                                    Dilaporkan
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                    Normal
                                                </span>
                                            )}
                                        </td>
                                        <td className={td}>
                                            <div className="flex justify-end gap-2">
                                                {c.reported_at && (
                                                    <button
                                                        type="button"
                                                        onClick={() => dismiss(c)}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                                                    >
                                                        Abaikan
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(c)}
                                                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200"
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

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                        <span>
                            Menampilkan {comments.from ?? 0}–{comments.to ?? 0} dari {comments.total} komentar
                        </span>
                        <Pagination current={Number(comments.links.find((l) => l.active)?.label ?? 1)} last={comments.last_page} total={comments.total} from={comments.from} to={comments.to} unit="komentar" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
