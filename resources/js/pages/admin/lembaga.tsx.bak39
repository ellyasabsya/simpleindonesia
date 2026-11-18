import { Head, Link, router } from '@inertiajs/react';
import { Building2, CheckCircle2, Clock, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import type { InstitutionRow, Paginated } from '@/types';

type Status = 'pending' | 'approved' | 'all';

type Props = {
    institutions: Paginated<InstitutionRow>;
    filters: { search: string; status: Status };
    counts: { pending: number; approved: number; all: number };
};

const dateFmt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});
const card =
    'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';

function Stat({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: typeof Building2;
    tone: string;
}) {
    return (
        <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                    {label}
                </span>
                <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
                >
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Data lembaga SIMPLE
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: InstitutionRow['status'] }) {
    const map = {
        approved: [
            '✓ Terverifikasi',
            'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30',
        ],
        pending: [
            'Menunggu',
            'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30',
        ],
        rejected: [
            'Ditolak',
            'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30',
        ],
    } as const;
    const [label, style] = map[status] ?? map.pending;
    return (
        <span
            className={`rounded-lg border px-3 py-1 text-xs font-bold ${style}`}
        >
            {label}
        </span>
    );
}

export default function AdminLembaga({ institutions, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search);
    const first = useRef(true);

    // Pencarian (debounce); selalu kembali ke halaman 1.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = window.setTimeout(() => {
            router.get(
                '/admin/lembaga',
                { search: search || undefined, status: filters.status },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const tabs: { key: Status; label: string; count: number }[] = [
        { key: 'pending', label: 'Belum Diverifikasi', count: counts.pending },
        { key: 'approved', label: 'Terverifikasi', count: counts.approved },
        { key: 'all', label: 'Semua Lembaga', count: counts.all },
    ];

    const act = (i: InstitutionRow, kind: 'approve' | 'revoke') => {
        const msg =
            kind === 'approve'
                ? `Verifikasi lembaga "${i.name}"?`
                : `Cabut verifikasi "${i.name}"?`;
        if (window.confirm(msg))
            router.patch(
                `/admin/lembaga/${i.id}/${kind}`,
                {},
                { preserveScroll: true },
            );
    };

    return (
        <AdminLayout title="Admin Panel">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
                <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                        SIMPLE Platform Management
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold">Manajemen Lembaga</h2>
                    <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-blue-50/90">
                        Kelola data lembaga penyelenggara, periksa keanggotaan, dan lakukan verifikasi lembaga yang terdaftar di SIMPLE.
                    </p>
                </div>
            </section>
            <Head title="Lembaga" />

            <div className="grid gap-4 md:grid-cols-3">
                <Stat
                    label="Total Lembaga"
                    value={counts.all}
                    icon={Building2}
                    tone="bg-indigo-100 text-indigo-700"
                />
                <Stat
                    label="Terverifikasi"
                    value={counts.approved}
                    icon={CheckCircle2}
                    tone="bg-emerald-100 text-emerald-700"
                />
                <Stat
                    label="Menunggu Verifikasi"
                    value={counts.pending}
                    icon={Clock}
                    tone="bg-amber-100 text-amber-700"
                />
            </div>

            <section className={card}>
                <div className="p-5 lg:p-6">
                    <h2 className="text-xl font-extrabold">Daftar Lembaga</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Periksa informasi dan status verifikasi setiap lembaga.
                    </p>

                    <div className="relative mt-5">
                        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama lembaga, email, telepon, atau anggota..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {tabs.map((t) => (
                            <Link
                                key={t.key}
                                href="/admin/lembaga"
                                data={{
                                    status: t.key,
                                    search: search || undefined,
                                }}
                                preserveScroll
                                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                                    filters.status === t.key
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-200'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                {t.label}{' '}
                                <span className="ml-2 text-xs">{t.count}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50/80 text-xs tracking-widest text-slate-500 uppercase dark:bg-white/5 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Lembaga</th>
                                <th className="px-6 py-4">Kontak</th>
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {institutions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-slate-500"
                                    >
                                        Tidak ada lembaga yang cocok.
                                    </td>
                                </tr>
                            )}
                            {institutions.data.map((i) => (
                                <tr key={i.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                                                {i.name.charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="font-bold">
                                                    {i.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    ID #{i.id}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Terdaftar{' '}
                                                    {i.created_at
                                                        ? dateFmt.format(
                                                              new Date(
                                                                  i.created_at,
                                                              ),
                                                          )
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p>{i.email}</p>
                                        <p className="text-slate-500">
                                            {i.phone}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">
                                            {i.member_name ?? '-'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {i.member_email}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={i.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {i.status === 'approved' ? (
                                            <button
                                                onClick={() => act(i, 'revoke')}
                                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200"
                                            >
                                                Cabut Verifikasi
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    act(i, 'approve')
                                                }
                                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                                            >
                                                Verifikasi
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <span>
                        Menampilkan {institutions.from ?? 0}–
                        {institutions.to ?? 0} dari {institutions.total} lembaga
                    </span>
                    {institutions.last_page > 1 && (
                        <nav
                            className="flex flex-wrap gap-1"
                            aria-label="Pagination"
                        >
                            {institutions.links.map((link, idx) => {
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
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        preserveScroll
                                        className={cls}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span
                                        key={idx}
                                        className={`${cls} opacity-40`}
                                    >
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
