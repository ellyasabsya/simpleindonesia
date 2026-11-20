import { Head, Link, usePage } from '@inertiajs/react';
import { Award, CalendarDays, Search, Ticket, Trophy, type LucideIcon } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import NotificationBell from '@/components/user/notification-bell';
import Avatar from '@/components/user/avatar';
import PosterCard from '../kit/poster-card';
import { usePlatform } from '../use-platform';

type Shared = { auth?: { user?: { name?: string; avatar?: string | null } | null }; events?: EventCard[]; votings?: EventCard[] };

const SHORTCUTS: { label: string; href: string; icon: LucideIcon; grad: string; reload?: boolean }[] = [
    { label: 'Event', href: '/events', icon: CalendarDays, grad: 'from-indigo-500 to-blue-600' },
    { label: 'Voting', href: '/voting', icon: Trophy, grad: 'from-violet-500 to-fuchsia-600', reload: true },
    { label: 'Tiket', href: '/tiket', icon: Ticket, grad: 'from-sky-500 to-indigo-600' },
    { label: 'Sertifikat', href: '/sertifikat-saya', icon: Award, grad: 'from-amber-500 to-orange-600', reload: true },
];

function Heading({ title, href }: { title: string; href: string }) {
    return (
        <div className="mb-3 flex items-end justify-between px-5">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <Link href={href} className="text-sm font-semibold text-indigo-600 active:opacity-60 dark:text-indigo-300">Lihat semua</Link>
        </div>
    );
}

export default function HomeMobile() {
    const ios = usePlatform() === 'ios';
    const { auth, events = [], votings = [] } = usePage<Shared>().props;
    const user = auth?.user ?? null;
    const first = user?.name?.split(' ')[0];
    const bg = ios ? 'bg-[#f2f2f7] dark:bg-black' : 'bg-[#f4f6fb] dark:bg-[#0b1020]';

    return (
        <>
            <Head title="SIMPLE - Kelola Event Lebih Cerdas" />
            <div data-mobile-screen={ios ? 'ios' : 'android'} className={'relative min-h-dvh overflow-x-hidden text-slate-900 dark:text-white ' + bg}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-200/70 via-violet-100/40 to-transparent dark:from-indigo-900/40 dark:via-violet-950/20" />

                <div className="relative pb-[calc(7rem+env(safe-area-inset-bottom))]">
                    <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
                        <div className="flex min-w-0 items-center gap-3">
                            {user ? (
                                <Avatar name={user.name ?? 'Pengguna'} src={user.avatar ?? null} className="size-11 rounded-full text-base" />
                            ) : (
                                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white shadow-lg shadow-indigo-900/30">S</span>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user ? 'Selamat datang kembali' : 'SIMPLE'}</p>
                                <p className="truncate text-lg leading-tight font-extrabold">{user ? first : 'Kelola event lebih cerdas'}</p>
                            </div>
                        </div>
                        {user ? (
                            <NotificationBell />
                        ) : (
                            <Link href="/login" className="rounded-full bg-gradient-to-r from-indigo-700 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/25 active:scale-95">Masuk</Link>
                        )}
                    </header>

                    <h1 className="mt-6 px-5 text-[32px] leading-[1.1] font-black tracking-tight">
                        Temukan event<br />
                        <span className="bg-gradient-to-r from-indigo-700 to-fuchsia-600 bg-clip-text text-transparent">yang kamu suka</span>
                    </h1>

                    <Link href="/events" className="mx-5 mt-5 flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-slate-400 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.25)] transition-transform active:scale-[0.98] dark:bg-white/10 dark:text-slate-400">
                        <Search className="size-5" />
                        <span className="text-[15px]">Cari event, lokasi, atau penyelenggara</span>
                    </Link>

                    <nav className="mt-7 grid grid-cols-4 gap-2 px-5">
                        {SHORTCUTS.map((s) => {
                            const inner = (
                                <>
                                    <span className={'flex size-14 items-center justify-center rounded-[20px] bg-gradient-to-br text-white shadow-lg shadow-indigo-900/20 ' + s.grad}>
                                        <s.icon className="size-6" />
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
                                </>
                            );
                            const cls = 'flex flex-col items-center gap-2 transition-transform active:scale-90';
                            return s.reload ? (
                                <a key={s.label} href={s.href} className={cls}>{inner}</a>
                            ) : (
                                <Link key={s.label} href={s.href} className={cls}>{inner}</Link>
                            );
                        })}
                    </nav>

                    <section className="mt-9">
                        <Heading title="Event terbaru" href="/events" />
                        {events.length === 0 ? (
                            <p className="mx-5 rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-white/15">Belum ada event</p>
                        ) : (
                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
                                {events.slice(0, 6).map((e) => (
                                    <PosterCard key={e.id} event={e} href={e.href ?? '/events/' + (e.slug ?? e.id)} className="w-[72%] max-w-[300px]" />
                                ))}
                            </div>
                        )}
                    </section>

                    {votings.length > 0 && (
                        <section className="mt-6">
                            <Heading title="E-Voting dibuka" href="/voting" />
                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
                                {votings.slice(0, 6).map((v) => (
                                    <PosterCard key={v.id} event={v} wide href={v.href ?? '/voting/' + v.id} className="w-[84%] max-w-[340px]" />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
