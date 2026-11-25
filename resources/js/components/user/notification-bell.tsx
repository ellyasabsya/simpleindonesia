import { Link, router, usePage, usePoll } from '@inertiajs/react';
import { Bell, Check, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CARD, FIELD, MUTED, PRESS } from '@/components/mobile/kit/soft';
import { usePhone } from '@/components/mobile/use-phone';

type N = { id: string; text: string; url?: string | null; read: boolean; at: string };
const when = (d: string) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function NotificationBell() {
    const pg = usePage().props as any;
    const items: N[] = pg.notifications ?? [];
    const unread: number = pg.unread ?? items.filter((n) => !n.read).length;
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const phone = usePhone();

    // cek notifikasi baru tiap 45 detik (hanya prop notifikasi; melambat otomatis di tab latar belakang)
    usePoll(45000, { only: ['notifications', 'unread'] });
    const seen = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        const top = items[0]?.id ?? null;
        if (seen.current !== undefined && top && top !== seen.current) {
            // ada notifikasi baru: segarkan status halaman (mis. lembaga baru terverifikasi)
            router.reload();
        }
        seen.current = top;
    }, [items[0]?.id]);

    useEffect(() => {
        if (phone) return;
        const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [phone]);

    const mark = (n: N) => {
        setOpen(false);
        if (n.read) return;
        const tk = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1] ?? '');
        fetch(`/notifikasi/${n.id}/baca`, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'X-XSRF-TOKEN': tk, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }).catch(() => {});
    };

    useEffect(() => {
        if (!(open && phone)) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open, phone]);

    const sheet = (
        <div className="fixed inset-0 z-[80]">
            <div onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-900/50" />
            <div role="dialog" aria-label="Notifikasi" className="absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white">
                <div className="flex justify-center pt-3">
                    <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                </div>
                <div className="flex items-center justify-between px-5 pt-3 pb-3">
                    <h3 className="text-[17px] font-semibold tracking-tight">Notifikasi</h3>
                    {unread > 0 && (
                        <button onClick={() => router.post('/notifikasi/baca', {}, { preserveScroll: true })} className="flex items-center gap-1 text-[13px] font-medium text-indigo-700 dark:text-indigo-300">
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
                                <Link key={n.id} href={n.url ?? '/dashboard'} onClick={() => mark(n)} className={'flex items-start gap-3 px-4 py-3.5 active:bg-slate-900/[0.04] dark:active:bg-white/10 ' + (n.read ? '' : 'bg-indigo-500/[0.06]')}>
                                    <span style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', boxShadow: '0 4px 10px -4px #4F46E5' }} className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white">
                                        <Bell className="size-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[13px] leading-snug font-medium">{n.text}</span>
                                        <span className={'mt-1 block text-[11px] ' + MUTED}>{when(n.at)}</span>
                                    </span>
                                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" />}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div ref={box} className="relative">
            <button onClick={() => setOpen(!open)} aria-label="Notifikasi" className={'relative flex items-center justify-center rounded-full ' + (phone ? 'size-10 text-slate-700 dark:text-slate-200 ' + CARD + ' ' + PRESS : 'h-12 w-12 bg-white/80 shadow-sm transition hover:bg-white dark:bg-white/10')}>
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">{unread > 9 ? '9+' : unread}</span>}
            </button>
            {open && phone && createPortal(sheet, document.body)}
            {open && !phone && (
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
