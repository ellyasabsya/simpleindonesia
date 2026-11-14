import { router } from '@inertiajs/react';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock, Mail, Phone, Search, User, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';

type Item = {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string | null;
    owner: { name: string; email: string } | null;
};

type Paginated = {
    data: Item[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    items: Paginated;
    filters: { status: string; q: string };
    counts: { all: number; pending: number; approved: number; rejected: number };
};

const badge: Record<Item['status'], { label: string; style: string }> = {
    pending: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    approved: { label: 'Terverifikasi', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    rejected: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
};

const card =
    'rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';

export default function AdminLembaga({ items, filters, counts }: Props) {
    const [q, setQ] = useState(filters.q);
    const [rejecting, setRejecting] = useState<Item | null>(null);
    const [reason, setReason] = useState('');
    const first = useRef(true);

    const go = (params: { status?: string; q?: string }) =>
        router.get(
            '/admin/lembaga',
            { status: params.status ?? filters.status, q: params.q ?? q },
            { preserveState: true, preserveScroll: true, replace: true },
        );

    // Pencarian dengan jeda 300 ms
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => go({ q }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const setStatus = (item: Item, status: string, why?: string) =>
        router.patch(`/admin/lembaga/${item.id}`, { status, reason: why }, { preserveScroll: true });

    const confirmReject = () => {
        if (!rejecting) return;
        setStatus(rejecting, 'rejected', reason);
        setRejecting(null);
        setReason('');
    };

    const tabs = [
        { key: 'pending', label: 'Menunggu', count: counts.pending },
        { key: 'approved', label: 'Terverifikasi', count: counts.approved },
        { key: 'rejected', label: 'Ditolak', count: counts.rejected },
        { key: 'all', label: 'Semua Lembaga', count: counts.all },
    ];

    const stats = [
        { label: 'Total lembaga', value: counts.all, icon: Building2, color: 'from-blue-500 to-indigo-600' },
        { label: 'Terverifikasi', value: counts.approved, icon: CheckCircle2, color: 'from-emerald-400 to-green-600' },
        { label: 'Menunggu verifikasi', value: counts.pending, icon: Clock, color: 'from-amber-400 to-orange-500' },
    ];

    return (
        <AdminLayout title="Manajemen Lembaga">
            {/* Banner */}
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
                        Kelola data lembaga penyelenggara, periksa pendaftaran, dan lakukan verifikasi lembaga yang
                        terdaftar di SIMPLE.
                    </p>
                </div>
            </section>

            {/* Statistik */}
            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`${card} flex items-center justify-between p-5`}>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-2 text-3xl font-extrabold">{value}</p>
                        </div>
                        <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                            <Icon className="h-6 w-6" />
                        </span>
                    </div>
                ))}
            </div>

            {/* Daftar */}
            <section className={`${card} p-6`}>
                <h3 className="text-xl font-extrabold">Daftar Lembaga</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Periksa informasi dan status verifikasi setiap lembaga.</p>

                <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-white/10 dark:bg-slate-900/60 dark:focus-within:ring-indigo-500/20">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari nama lembaga, email, telepon, atau pemilik akun..."
                        className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => go({ status: t.key })}
                            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                filters.status === t.key
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-400/40 dark:bg-indigo-500/20 dark:text-white'
                                    : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                            }`}
                        >
                            {t.label}
                            <span className="rounded-md bg-slate-100 px-1.5 text-xs dark:bg-white/10">{t.count}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-5 divide-y divide-slate-200/70 dark:divide-white/10">
                    {items.data.length === 0 && (
                        <div className="flex flex-col items-center py-14 text-center text-slate-500 dark:text-slate-400">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
                                <Building2 className="h-7 w-7" />
                            </span>
                            <p className="mt-4 font-semibold">Tidak ada lembaga</p>
                            <p className="text-sm">Belum ada data untuk filter atau pencarian ini.</p>
                        </div>
                    )}

                    {items.data.map((item) => (
                        <article key={item.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                            <div className="flex min-w-0 gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white">
                                    {item.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-base font-extrabold">{item.name}</h4>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge[item.status].style}`}>
                                            {badge[item.status].label}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{item.email}</span>
                                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{item.phone}</span>
                                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{item.owner?.name ?? '-'}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Didaftarkan {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                    </p>
                                    {item.status === 'rejected' && item.rejection_reason && (
                                        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                            Alasan: {item.rejection_reason}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {item.status !== 'approved' && (
                                    <button
                                        onClick={() => setStatus(item, 'approved')}
                                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Setujui
                                    </button>
                                )}
                                {item.status !== 'rejected' && (
                                    <button
                                        onClick={() => setRejecting(item)}
                                        className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300"
                                    >
                                        <XCircle className="h-4 w-4" /> Tolak
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                {items.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-4 text-sm dark:border-white/10">
                        <span className="text-slate-500 dark:text-slate-400">
                            Halaman {items.current_page} dari {items.last_page} · {items.total} lembaga
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={!items.prev_page_url}
                                onClick={() => items.prev_page_url && router.get(items.prev_page_url, {}, { preserveState: true, replace: true })}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm disabled:opacity-40 dark:bg-white/10"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                disabled={!items.next_page_url}
                                onClick={() => items.next_page_url && router.get(items.next_page_url, {}, { preserveState: true, replace: true })}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm disabled:opacity-40 dark:bg-white/10"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Modal tolak */}
            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRejecting(null)} />
                    <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                        <h3 className="text-xl font-extrabold">Tolak lembaga</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Tuliskan alasan untuk <b>{rejecting.name}</b> agar pendaftar tahu apa yang perlu diperbaiki.
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="Contoh: Data kontak tidak dapat dihubungi."
                            className="mt-4 w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setRejecting(null)}
                                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmReject}
                                className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
                            >
                                Tolak lembaga
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
