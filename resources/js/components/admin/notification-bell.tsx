import { router } from '@inertiajs/react';
import { Bell, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CARD, FIELD, MUTED, PRESS } from '@/components/mobile/kit/soft';
import { usePhone } from '@/components/mobile/use-phone';
import type { NotificationsProp } from '@/types';

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const min = Math.floor(
        Math.max(0, Date.now() - new Date(iso).getTime()) / 60000,
    );
    if (min < 1) return 'baru saja';
    if (min < 60) return `${min} menit lalu`;
    const hr = Math.floor(min / 60);
    return hr < 24 ? `${hr} jam lalu` : `${Math.floor(hr / 24)} hari lalu`;
}

export default function NotificationBell({
    notifications,
}: {
    notifications: NotificationsProp;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const unread = notifications?.unread_count ?? 0;
    const items = notifications?.items ?? [];
    const phone = usePhone();

    useEffect(() => {
        if (phone) return;
        const close = (e: Event) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('touchstart', close, { passive: true });
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
        };
    }, [phone]);

    // Cek ulang tiap 60 detik supaya pengajuan baru muncul tanpa refresh manual.
    useEffect(() => {
        const id = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['notifications', 'pending_lembaga', 'pending_comments', 'pending_review', 'pending_tiket', 'pending_paket', 'pending_penarikan'] });
            }
        }, 60000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (!(open && phone)) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, phone]);

    const openItem = (id: string, url: string | null) => {
        setOpen(false);
        router.post(
            `/admin/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (url) router.visit(url);
                },
            },
        );
    };

    return (
        <div className="sm:relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifikasi"
                className={'relative flex h-10 w-10 items-center justify-center rounded-full ' + (phone ? 'text-slate-700 dark:text-slate-200 ' + CARD + ' ' + PRESS : 'bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20')}
            >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && phone && createPortal(
                <div className="fixed inset-0 z-[80]">
                    <div onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-900/50" />
                    <div role="dialog" aria-label="Notifikasi" className="absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white">
                        <div className="flex justify-center pt-3">
                            <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                        </div>
                        <div className="flex items-center justify-between px-5 pt-3 pb-3">
                            <h3 className="text-[17px] font-semibold tracking-tight">Notifikasi</h3>
                            {unread > 0 && (
                                <button
                                    onClick={() => router.post('/admin/notifications/read-all', {}, { preserveScroll: true })}
                                    className="flex items-center gap-1 text-[13px] font-medium text-indigo-700 dark:text-indigo-300"
                                >
                                    <Check className="size-3.5" /> Tandai dibaca
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                            {items.length === 0 ? (
                                <div className={'flex flex-col items-center gap-2 rounded-3xl py-12 text-center text-[13px] ' + FIELD + ' ' + MUTED}>
                                    <Bell className="size-6" strokeWidth={1.5} />
                                    Belum ada notifikasi
                                </div>
                            ) : (
                                <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                                    {items.map((n) => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => openItem(n.id, n.url)}
                                            className={'flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-slate-900/[0.04] dark:active:bg-white/10 ' + (n.read ? '' : 'bg-indigo-500/[0.06]')}
                                        >
                                            <span style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', boxShadow: '0 4px 10px -4px #4F46E5' }} className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white">
                                                <Bell className="size-5" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[13px] leading-snug font-semibold">{n.title}</span>
                                                <span className="block text-[13px] leading-snug">{n.message}</span>
                                                <span className={'mt-1 block text-[11px] ' + MUTED}>{timeAgo(n.created_at)}</span>
                                            </span>
                                            {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body,
            )}
            {open && !phone && (
                <div className="absolute top-full right-3 left-3 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:top-auto sm:right-0 sm:left-auto sm:w-80 dark:border-white/10 dark:bg-indigo-950">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                        <span className="text-sm font-bold">Notifikasi</span>
                        {unread > 0 && (
                            <button
                                className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                                onClick={() =>
                                    router.post(
                                        '/admin/notifications/read-all',
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    <ul className="max-h-[60vh] overflow-y-auto sm:max-h-96">
                        {items.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-slate-500">
                                Belum ada notifikasi.
                            </li>
                        )}
                        {items.map((n) => (
                            <li key={n.id}>
                                <button
                                    onClick={() => openItem(n.id, n.url)}
                                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 ${
                                        n.read
                                            ? ''
                                            : 'bg-indigo-50/70 dark:bg-indigo-500/10'
                                    }`}
                                >
                                    <span
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-indigo-600'}`}
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold">
                                            {n.title}
                                        </span>
                                        <span className="block text-sm text-slate-600 dark:text-slate-300">
                                            {n.message}
                                        </span>
                                        <span className="block text-xs text-slate-400">
                                            {timeAgo(n.created_at)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
