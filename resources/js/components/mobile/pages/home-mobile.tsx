import { Head, Link, usePage } from '@inertiajs/react';
import { Award, Moon, Search, Sun, Ticket } from 'lucide-react';
import { useState } from 'react';
import type { EventCard } from '@/components/landing/event-section';
import type { PackageCard } from '@/components/landing/package-card';
import { useTheme } from '@/hooks/use-theme';
import Avatar from '@/components/user/avatar';
import NotificationBell from '@/components/user/notification-bell';
import MobileBottomNav from '../bottom-nav';
import { EventPanel, NewsPanel, PackagePanel, TicketPanel, VotingPanel, type NewsCard } from '../home/panels';
import IconTabs, { type IconTabKey } from '../kit/icon-tabs';
import { CARD, FIELD, LUX_CSS, MUTED, PAGE, PRESS } from '../kit/soft';
import { usePlatform } from '../use-platform';

type Shared = {
    auth?: { user?: { name?: string; avatar?: string | null } | null };
    events?: EventCard[];
    votings?: EventCard[];
    packages?: PackageCard[];
    latestNews?: NewsCard[];
};

type Tab = IconTabKey;

export default function HomeMobile() {
    const ios = usePlatform() === 'ios';
    const { dark, toggle } = useTheme();
    const { auth, events = [], votings = [], packages = [], latestNews = [] } = usePage<Shared>().props;
    const { url } = usePage();
    const publicView = /[?&]publik=1(&|$)/.test(url);
    const user = publicView ? null : (auth?.user ?? null);
    const account = auth?.user ?? null;
    const first = user?.name?.split(' ')[0];
    const [tab, setTab] = useState<Tab>('event');

    return (
        <>
            <Head title="SIMPLE - Kelola Event Lebih Cerdas" />
            <div data-mobile-screen={ios ? 'ios' : 'android'} className={'min-h-dvh overflow-x-clip text-slate-900 dark:text-white ' + PAGE}>
                <style>{LUX_CSS}</style>
                <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
                    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-transparent px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2">
                        {user ? (
                            <Link href="/dashboard" aria-label="Dashboard" className="flex min-w-0 items-center gap-3">
                                <Avatar name={user.name ?? 'Pengguna'} src={user.avatar ?? null} className="size-10 shrink-0 rounded-full text-sm" />
                                <span className="min-w-0">
                                    <span className={'block text-[11px] ' + MUTED}>Selamat datang</span>
                                    <span className="block truncate text-base leading-tight font-semibold">{first}</span>
                                </span>
                            </Link>
                        ) : (
                            <Link href={publicView ? '/?publik=1' : '/'} aria-label="SIMPLE" className={'flex items-center ' + PRESS}>
                                <img
                                    src="/logo-s-sm.png"
                                    alt="SIMPLE"
                                    width={36}
                                    height={36}
                                    className="size-9 object-contain dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
                                />
                            </Link>
                        )}
                        <div className="flex shrink-0 items-center gap-1">
                            {!user && (
                                <Link href="/events" aria-label="Cari event" className={'flex size-10 items-center justify-center rounded-full ' + MUTED + ' ' + PRESS}>
                                    <Search className="size-[22px]" strokeWidth={1.8} />
                                </Link>
                            )}
                            <button type="button" onClick={toggle} aria-label="Ganti tema" className={'flex size-10 items-center justify-center rounded-full ' + MUTED + ' ' + PRESS}>
                                {dark ? <Sun className="size-[22px]" strokeWidth={1.8} /> : <Moon className="size-[22px]" strokeWidth={1.8} />}
                            </button>
                            {user && <NotificationBell />}
                        </div>
                    </header>

                    <div className="h-[calc(env(safe-area-inset-top)+4rem)]" />

                    {/* Sudah login tapi melihat beranda publik: sapaan dan jalan kembali, tanpa ajakan daftar. */}
                    {!user && account && (
                        <section className={'mx-5 mt-5 flex items-center gap-3 rounded-3xl px-4 py-3.5 ' + CARD}>
                            <Avatar name={account.name ?? 'Pengguna'} src={account.avatar ?? null} className="size-10 shrink-0 rounded-full text-sm" />
                            <div className="min-w-0 flex-1">
                                <p className={'text-[11px] ' + MUTED}>Selamat datang kembali</p>
                                <p className="truncate text-base leading-tight font-semibold">{account.name?.split(' ')[0]}</p>
                            </div>
                            <Link
                                href="/dashboard"
                                className={'flex h-10 shrink-0 items-center rounded-full bg-indigo-600 px-5 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}
                            >
                                Dashboard
                            </Link>
                        </section>
                    )}

                    {/* Tamu: ajakan satu baris, bukan hero landing page. */}
                    {!user && !account && (
                        <section className="relative mx-5 mt-5 flex items-center gap-4 overflow-hidden rounded-3xl bg-[radial-gradient(120%_140%_at_100%_0%,rgba(129,140,248,0.34),transparent_60%),linear-gradient(160deg,#312e81,#0a0c1a)] px-5 py-4 text-white ring-1 ring-indigo-300/25">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-[17px] leading-snug font-semibold tracking-tight">Temukan event yang kamu suka</h1>
                                <p className="mt-1 text-xs leading-relaxed text-slate-300">Pendaftaran, penilaian juri, dan publikasi event dalam satu platform.</p>
                            </div>
                            <Link
                                href="/register"
                                className={'relative flex h-10 shrink-0 items-center overflow-hidden rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)] ' + PRESS}
                            >
                                <span aria-hidden className="lux-sheen" />
                                Daftar
                            </Link>
                        </section>
                    )}

                    {/* Peserta: dua jalan pintas milik sendiri. */}
                    {user && (
                        <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
                            <Link href="/tiket" className={'flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium ' + CARD + ' ' + PRESS}>
                                <Ticket className="size-[18px]" strokeWidth={1.7} />
                                Tiket saya
                            </Link>
                            <a href="/sertifikat-saya" className={'flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium ' + CARD + ' ' + PRESS}>
                                <Award className="size-[18px]" strokeWidth={1.7} />
                                Sertifikat
                            </a>
                        </div>
                    )}

                    
                            <div className="mt-3">
                                <IconTabs value={tab} onChange={setTab} dots={{ voting: votings.length > 0 }} />
                            </div>


                    <main key={tab} className="lux-fade px-5 pt-1">
                        {tab === 'event' && <EventPanel events={events} />}
                        {tab === 'voting' && <VotingPanel votings={votings} />}
                        {tab === 'tiket' && <TicketPanel />}
                        {tab === 'paket' && <PackagePanel packages={packages} />}
                        {tab === 'berita' && <NewsPanel items={latestNews} />}
                    </main>

                    <p className={'mt-10 px-5 text-center text-xs ' + MUTED}>© {new Date().getFullYear()} SIMPLE. Semua hak dilindungi.</p>
                </div>
            </div>
            <MobileBottomNav variant={user ? 'user' : 'public'} />
        </>
    );
}
