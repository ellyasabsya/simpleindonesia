import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // Cek ulang tiap 30 detik supaya pengajuan baru muncul tanpa refresh manual.
    useEffect(() => {
        const id = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['notifications', 'pending_lembaga'] });
            }
        }, 30000);
        return () => window.clearInterval(id);
    }, []);

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
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifikasi"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-indigo-950">
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
                    <ul className="max-h-96 overflow-y-auto">
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
