import { router } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Inbox, Layers, Search, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Pagination from '@/components/admin/pagination';
import { CARD, MUTED } from '../kit/soft';

type Ev = {
    id: number;
    title: string;
    category: string;
    location: string;
    starts_at: string;
    ends_at: string;
    status: 'pending' | 'published' | 'rejected';
    rejection_reason: string | null;
    poster_url: string | null;
    institution: string | null;
    package: string;
    price_label: string;
    payment_label: string;
    share_percent: number | null;
    sub_count: number;
    children: { id: number; title: string; category: string | null; location: string | null; starts_at: string | null; ends_at: string | null; poster_url: string | null }[];
};

type Props = {
    events: { data: Ev[]; current_page: number; last_page: number; total: number; prev_page_url: string | null; next_page_url: string | null };
    filters: { status: string; search: string };
    counts: { all: number; pending: number; published: number; rejected: number };
    base: string;
    pageTitle: string;
};

const badge = {
    pending: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    published: { label: 'Tayang', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    rejected: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReviewEventMobile({ events, filters, counts, base, pageTitle }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [rejecting, setRejecting] = useState<Ev | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [openIds, setOpenIds] = useState<number[]>([]);
    const first = useRef(true);

    const toggleOpen = (id: number) => setOpenIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const go = (p: { status?: string; search?: string }) =>
        router.get(base, { status: p.status ?? filters.status, search: p.search ?? search }, { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => go({ search }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        if (!rejecting) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [rejecting]);

    const approve = (e: Ev) => router.patch(`/admin/events/${e.id}/approve`, {}, { preserveScroll: true });

    const confirmReject = () => {
        if (!rejecting) return;
        router.patch(
            `/admin/events/${rejecting.id}/reject`,
            { reason },
            {
                preserveScroll: true,
                onError: (errs) => setError(errs.reason ?? 'Gagal menolak event.'),
                onSuccess: () => {
                    setRejecting(null);
                    setReason('');
                    setError('');
                },
            },
        );
    };

    const tabs = [
        { key: 'pending', label: 'Menunggu', count: counts.pending },
        { key: 'published', label: 'Tayang', count: counts.published },
        { key: 'rejected', label: 'Ditolak', count: counts.rejected },
        { key: 'all', label: 'Semua Event', count: counts.all },
    ];

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">{pageTitle}</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    {base === '/admin/review'
                        ? 'Semua pengajuan event beserta paket, harga, dan metode pembayarannya. Transfer manual diverifikasi di Verifikasi Paket; event dengan pembayaran Midtrans yang sudah lunas diperiksa di sini.'
                        : 'Lihat dan kelola semua event di semua status, lalu tayangkan atau tolak dengan alasan.'}
                </p>
            </section>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
                {tabs.map((t) => {
                    const active = filters.status === t.key;
                    const alert = t.key === 'pending' && t.count > 0;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => go({ status: t.key })}
                            className={
                                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                                (active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')
                            }
                        >
                            {t.label}
                            <span className={'rounded-full px-1.5 text-[11px] font-bold ' + (active ? 'bg-white/25 text-white' : alert ? 'bg-amber-100 text-amber-800' : 'bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
                                {t.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari event, lokasi, lembaga"
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </div>

            {events.data.length === 0 ? (
                <div className={'flex flex-col items-center rounded-2xl px-4 py-8 text-center ' + CARD}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Tidak ada event</p>
                    <p className={'mt-1 text-xs ' + MUTED}>Belum ada data untuk filter atau pencarian ini.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {events.data.map((e) => (
                        <div key={e.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start gap-3">
                                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-indigo-600">
                                    {e.poster_url && <img loading="lazy" decoding="async" src={e.poster_url} alt={e.title} className="absolute inset-0 h-full w-full object-cover" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="text-[15px] leading-snug font-semibold break-words">{e.title}</div>
                                        <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + badge[e.status].style}>{badge[e.status].label}</span>
                                    </div>
                                    <div className={'text-xs ' + MUTED}>
                                        {e.institution ?? '-'} · {e.package} · {e.price_label} · {e.payment_label}
                                    </div>
                                </div>
                            </div>

                            <div className="text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                                <div>
                                    {fmt(e.starts_at)} – {fmt(e.ends_at)}
                                </div>
                                {e.location && <div className="break-words">{e.location}</div>}
                            </div>

                            {e.sub_count > 0 ? (
                                <button type="button" onClick={() => toggleOpen(e.id)} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                                    <Layers className="h-3 w-3" /> Rangkaian · {e.sub_count} kegiatan
                                    <ChevronDown className={'h-3 w-3 transition ' + (openIds.includes(e.id) ? 'rotate-180' : '')} />
                                </button>
                            ) : (
                                e.category && <div className={'text-xs ' + MUTED}>{e.category}</div>
                            )}

                            {e.status === 'rejected' && e.rejection_reason && <p className="text-xs text-rose-600 dark:text-rose-300">Alasan: {e.rejection_reason}</p>}
                            {e.status === 'pending' && e.sub_count > 0 && <p className={'text-xs ' + MUTED}>Aksi berlaku untuk event utama dan seluruh kegiatannya.</p>}

                            {e.sub_count > 0 && openIds.includes(e.id) && (
                                <ul className="space-y-1.5">
                                    {e.children.map((c) => (
                                        <li key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] dark:border-white/10 dark:bg-white/5">
                                            <div className="font-semibold">
                                                {c.title}
                                                {c.category ? <span className="ml-2 text-xs text-indigo-700 dark:text-indigo-300">{c.category}</span> : null}
                                            </div>
                                            <div className={'text-xs ' + MUTED}>
                                                {c.location ?? '-'}
                                                {c.starts_at && c.ends_at ? ` · ${fmt(c.starts_at)} – ${fmt(c.ends_at)}` : ''}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex gap-2 pt-1">
                                {e.status !== 'published' && (
                                    <button type="button" onClick={() => approve(e)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-sm font-semibold text-white">
                                        <CheckCircle2 className="h-4 w-4" /> Tayangkan
                                    </button>
                                )}
                                {e.status !== 'rejected' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRejecting(e);
                                            setError('');
                                        }}
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                                    >
                                        <XCircle className="h-4 w-4" /> Tolak
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination current={events.current_page} last={events.last_page} total={events.total} unit="event" />

            {rejecting &&
                createPortal(
                    <div className="fixed inset-0 z-[80]">
                        <div onClick={() => setRejecting(null)} className="absolute inset-0 bg-slate-900/50" />
                        <div role="dialog" aria-label="Tolak event" className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white">
                            <div className="flex justify-center pt-3">
                                <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                            </div>
                            <div className="overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                                <h3 className="text-[17px] font-semibold tracking-tight">Tolak event</h3>
                                <p className={'mt-1 text-[13px] leading-snug ' + MUTED}>
                                    Tuliskan alasan untuk <b>{rejecting.title}</b> agar lembaga tahu apa yang perlu diperbaiki.
                                </p>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Contoh: Poster tidak sesuai ketentuan."
                                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                                />
                                {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setRejecting(null)} className="h-11 rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                        Batal
                                    </button>
                                    <button type="button" onClick={confirmReject} className="h-11 rounded-full bg-rose-600 text-sm font-semibold text-white">
                                        Tolak event
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
