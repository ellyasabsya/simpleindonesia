import { Head, Link, router, usePage } from '@inertiajs/react';
import Avatar from '@/components/user/avatar';
import NotificationBell from '@/components/user/notification-bell';
import { Toast } from '@/lib/toast';
import { Award, Building2, ChevronDown, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import PageBackground from '@/components/page-background';
import MobileBottomNav from '@/components/mobile/bottom-nav';
import { useTheme } from '@/hooks/use-theme';
import { useIdleLogout } from '@/hooks/use-idle-logout';

export default function UserLayout({ title, hasPanel, children }: { title: string; hasPanel?: boolean; children: ReactNode }) {
    const { dark, toggle } = useTheme();
    const [open, setOpen] = useState(false);
    const page = usePage<{ auth?: { user?: { name?: string; email?: string; avatar?: string | null } }; profile?: { avatar?: string | null } | null; userHasPanel?: boolean }>().props;
    const user = page.auth?.user;
    const panel = Boolean(hasPanel) || Boolean(page.userHasPanel);
    useIdleLogout(30, !!user);
    const avatar = page.profile?.avatar ?? user?.avatar ?? null;
    const name = user?.name ?? 'Pengguna';

    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <PageBackground />
            <MobileBottomNav variant="user" hasPanel={panel} />

            <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-indigo-950/40">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">S</span>
                        <span className="text-xl font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">SIMPLE</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
<button onClick={toggle} aria-label="Ganti tema" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <div className="relative">
                            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20">
                                <Avatar name={name} src={avatar} className="h-9 w-9 rounded-full text-sm" />
                                <span className="hidden text-sm font-bold sm:block">{name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {open && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/70 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                                        <div className="flex items-center gap-3 px-3 py-2">
                                            <Avatar name={name} src={avatar} className="h-10 w-10 rounded-full text-base" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold">{name}</p>
                                                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                                            </div>
                                        </div>
                                        <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                                        </Link>
                                        <a href="/sertifikat-saya" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                                            <Award className="h-4 w-4" /> Sertifikat Saya
                                        </a>
                                        <Link href={panel ? '/panel' : '/lembaga/daftar'} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                                            <Building2 className="h-4 w-4" /> {panel ? 'Panel Lembaga' : 'Daftarkan Lembaga'}
                                        </Link>
                                        <button onClick={() => router.post('/logout')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">
                                            <LogOut className="h-4 w-4" /> Keluar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative z-10 min-h-screen text-slate-900 dark:text-white">
                <main className="mx-auto max-w-7xl space-y-6 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(5.5rem+env(safe-area-inset-top))] md:px-6 md:pb-16 md:pt-28"><Toast />
{children}</main>
            </div>
        </>
    );
}
