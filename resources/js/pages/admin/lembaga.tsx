import { Head, Link, router } from '@inertiajs/react';
import { Building2, CheckCircle2, Clock, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';
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
    'rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5';

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
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {label} <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</div>
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
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                        SIMPLE Platform Management
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold">Manajemen Lembaga</h2>
                    <p className="mt-1 max-w-2xl text-sm text-white/80">
                        Kelola data lembaga penyelenggara, periksa keanggotaan, dan lakukan verifikasi lembaga yang terdaftar di SIMPLE.
                    </p>
                </div>
            </section>
            <Head title="Lembaga" />

            <div className="grid gap-3 md:grid-cols-3">
                <Stat
                    label="Total Lembaga"
                    value={counts.all}
                    icon={Building2}
                    tone="text-indigo-600"
                />
                <Stat
                    label="Terverifikasi"
                    value={counts.approved}
                    icon={CheckCircle2}
                    tone="text-emerald-600"
                />
                <Stat
                    label="Menunggu Verifikasi"
                    value={counts.pending}
                    icon={Clock}
                    tone="text-amber-600"
                />
            </div>

            <section className={card}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {tabs.map((t) => (
                            <Link
                                key={t.key}
                                href="/admin/lembaga"
                                data={{
                                    status: t.key,
                                    search: search || undefined,
                                }}
                                preserveScroll
                                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                                    filters.status === t.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                                }`}
                            >
                                {t.label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                        filters.status === t.key
                                            ? 'bg-white/25 text-white'
                                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari lembaga, email, telepon"
                            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5"
                        />
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
                    <Pagination current={Number(institutions.links.find((l) => l.active)?.label ?? 1)} last={institutions.last_page} total={(institutions as unknown as { total?: number }).total ?? 0} from={(institutions as unknown as { from?: number | null }).from} to={(institutions as unknown as { to?: number | null }).to} unit="lembaga" />
                </div>
            </section>
        </AdminLayout>
    );
}
