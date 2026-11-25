import { router } from '@inertiajs/react';
import { Building2, CheckCircle2, Clock, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Pagination from '@/components/admin/pagination';
import type { InstitutionRow, Paginated } from '@/types';
import { CARD, MUTED } from '../kit/soft';

type Status = 'pending' | 'approved' | 'all';

type Props = {
    institutions: Paginated<InstitutionRow>;
    filters: { search: string; status: Status };
    counts: { pending: number; approved: number; all: number };
};

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const BADGE = {
    approved: ['Terverifikasi', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'],
    pending: ['Menunggu', 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'],
    rejected: ['Ditolak', 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'],
} as const;

export default function LembagaAdminMobile({ institutions, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = window.setTimeout(() => {
            router.get('/admin/lembaga', { search: search || undefined, status: filters.status }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const goStatus = (status: Status) =>
        router.get('/admin/lembaga', { status, search: search || undefined }, { preserveScroll: true, preserveState: true, replace: true });

    const act = (i: InstitutionRow, kind: 'approve' | 'revoke') => {
        const msg = kind === 'approve' ? `Verifikasi lembaga "${i.name}"?` : `Cabut verifikasi "${i.name}"?`;
        if (window.confirm(msg)) router.patch(`/admin/lembaga/${i.id}/${kind}`, {}, { preserveScroll: true });
    };

    const tabs: { key: Status; label: string; count: number }[] = [
        { key: 'pending', label: 'Belum Diverifikasi', count: counts.pending },
        { key: 'approved', label: 'Terverifikasi', count: counts.approved },
        { key: 'all', label: 'Semua Lembaga', count: counts.all },
    ];

    const tiles = [
        { label: 'Total Lembaga', n: counts.all, icon: Building2, tone: 'text-indigo-600 dark:text-indigo-300', wide: true },
        { label: 'Terverifikasi', n: counts.approved, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-300', wide: false },
        { label: 'Menunggu', n: counts.pending, icon: Clock, tone: 'text-amber-600 dark:text-amber-300', wide: false },
    ];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Manajemen Lembaga</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Kelola data lembaga penyelenggara, periksa keanggotaan, dan verifikasi lembaga yang terdaftar.
                </p>
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

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari lembaga, email, telepon"
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </div>

            {institutions.data.length === 0 ? (
                <div className={'rounded-2xl px-4 py-8 text-center text-sm ' + CARD + ' ' + MUTED}>Tidak ada lembaga yang cocok.</div>
            ) : (
                <div className="space-y-2">
                    {institutions.data.map((i) => {
                        const [label, style] = BADGE[i.status] ?? BADGE.pending;
                        return (
                            <div key={i.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">{i.name.charAt(0).toUpperCase()}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[15px] leading-snug font-semibold break-words">{i.name}</p>
                                            <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ' + style}>{label}</span>
                                        </div>
                                        <p className={'text-xs ' + MUTED}>
                                            ID #{i.id} · Terdaftar {i.created_at ? dateFmt.format(new Date(i.created_at)) : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-[13px] leading-snug">
                                    <p className="break-all">{i.email}</p>
                                    {i.phone && <p className={MUTED}>{i.phone}</p>}
                                </div>

                                <div className="text-[13px] leading-snug">
                                    <p className="font-medium">Anggota: {i.member_name ?? '-'}</p>
                                    {i.member_email && <p className={'text-xs break-all ' + MUTED}>{i.member_email}</p>}
                                </div>

                                {i.status === 'approved' ? (
                                    <button type="button" onClick={() => act(i, 'revoke')} className="h-10 w-full rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                                        Cabut Verifikasi
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => act(i, 'approve')} className="h-10 w-full rounded-full bg-emerald-600 text-sm font-semibold text-white">
                                        Verifikasi
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className={'px-1 text-xs ' + MUTED}>
                Menampilkan {institutions.from ?? 0}–{institutions.to ?? 0} dari {institutions.total} lembaga
            </p>
            <Pagination current={Number(institutions.links.find((l) => l.active)?.label ?? 1)} last={institutions.last_page} total={(institutions as unknown as { total?: number }).total ?? 0} from={(institutions as unknown as { from?: number | null }).from} to={(institutions as unknown as { to?: number | null }).to} unit="lembaga" />
        </div>
    );
}
