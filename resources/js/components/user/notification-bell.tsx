import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Check, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type N = { id: string; text: string; url?: string | null; read: boolean; at: string };
const when = (d: string) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function NotificationBell() {
    const pg = usePage().props as any;
    const items: N[] = pg.notifications ?? [];
    const unread: number = pg.unread ?? 0;
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={box} className="relative">
            <button onClick={() => setOpen(!open)} aria-label="Notifikasi" className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm transition hover:bg-white dark:bg-white/10">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">{unread > 9 ? '9+' : unread}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                    <div className="flex items-center justify-between px-5 py-4">
                        <p className="text-lg font-extrabold">Notifikasi</p>
                        {unread > 0 && <button onClick={() => router.post('/notifikasi/baca', {}, { preserveScroll: true })} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-300"><Check className="h-3.5 w-3.5" /> Tandai dibaca</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto border-t border-slate-200/70 dark:border-white/10">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-white/10"><Bell className="h-5 w-5 text-sky-500" /></span>
                                <p className="font-extrabold">Belum ada notifikasi</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Kabar pertemanan dan undangan muncul di sini.</p>
                            </div>
                        ) : items.map((n) => (
                            <Link key={n.id} href={n.url ?? '/dashboard'} onClick={() => { setOpen(false); if (!n.read) { const tk = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1] ?? ''); fetch(`/notifikasi/${n.id}/baca`, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'X-XSRF-TOKEN': tk, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }).catch(() => {}); } }} className={`flex items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-white/5 ${n.read ? '' : 'bg-indigo-50/70 dark:bg-indigo-500/10'}`}>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white"><UserPlus className="h-5 w-5" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold leading-snug">{n.text}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{when(n.at)}</span>
                                </span>
                                {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
