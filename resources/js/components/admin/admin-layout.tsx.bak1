import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import NotificationBell from '@/components/admin/notification-bell';
import PageBackground from '@/components/page-background';
import { adminMenu } from '@/data/admin-menu';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationsProp } from '@/types';

type PageProps = {
    auth?: { user?: { name?: string; role?: string } };
    notifications?: NotificationsProp;
    pending_lembaga?: number;
};

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const { url } = usePage();
    const path = url.split('?')[0];
    const pendingLembaga = usePage<PageProps>().props.pending_lembaga ?? 0;

    return (
        <div className="flex h-full flex-col">
            <Link
                href="/"
                onClick={onNavigate}
                className="flex items-center gap-3 px-6 pt-6 pb-5"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">
                    S
                </span>
                <span>
                    <span className="block text-lg leading-none font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">
                        SIMPLE
                    </span>
                    <span className="mt-1 block text-[10px] font-bold tracking-[0.25em] text-indigo-500 uppercase dark:text-indigo-300">
                        Admin Workspace
                    </span>
                </span>
            </Link>

            <nav className="flex-1 [scrollbar-width:none] space-y-5 overflow-y-auto px-4 pb-4">
                {adminMenu.map((group) => (
                    <div key={group.title}>
                        <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map(({ label, href, icon: Icon }) => {
                                const active =
                                    href === '/admin'
                                        ? path === '/admin'
                                        : path.startsWith(href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={onNavigate}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                            active
                                                ? 'bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-600/25'
                                                : 'text-slate-600 hover:bg-white/80 hover:text-indigo-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-[18px] w-[18px]" />
                                        {label}
                                        {href === '/admin/lembaga' &&
                                            pendingLembaga > 0 && (
                                                <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                                                    {pendingLembaga}
                                                </span>
                                            )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-slate-200/70 p-4 dark:border-white/10">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/80 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-indigo-700 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Halaman Utama
                </Link>
            </div>
        </div>
    );
}

export default function AdminLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { dark, toggle } = useTheme();
    const [open, setOpen] = useState(false);
    const { auth, notifications } = usePage<PageProps>().props;
    const user = auth?.user;
    const initial = (user?.name ?? 'A').charAt(0).toUpperCase();

    return (
        <>
            <Head title={`${title} - Admin SIMPLE`} />
            <PageBackground />

            {/* Sidebar desktop */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/60 bg-white/60 backdrop-blur-xl lg:block dark:border-white/10 dark:bg-indigo-950/40">
                <Sidebar />
            </aside>

            {/* Drawer mobile */}
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-white/95 shadow-2xl dark:bg-indigo-950/95">
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Tutup menu"
                            className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <Sidebar onNavigate={() => setOpen(false)} />
                    </aside>
                </div>
            )}

            <div className="relative z-10 min-h-screen text-slate-900 lg:pl-64 dark:text-white">
                {/* Topbar */}
                <header className="sticky top-0 z-20 border-b border-white/60 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-indigo-950/40">
                    <div className="flex h-16 items-center justify-between px-5 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setOpen(true)}
                                aria-label="Buka menu"
                                className="rounded-lg p-2 text-slate-600 hover:bg-white/80 lg:hidden dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <h1 className="text-lg font-extrabold">{title}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationBell
                                notifications={notifications ?? null}
                            />
                            <button
                                onClick={toggle}
                                aria-label="Ganti tema"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                            >
                                {dark ? (
                                    <Sun className="h-[18px] w-[18px]" />
                                ) : (
                                    <Moon className="h-[18px] w-[18px]" />
                                )}
                            </button>

                            <div className="flex items-center gap-2.5 rounded-full bg-white/70 py-1 pr-4 pl-1 shadow-sm dark:bg-white/10">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
                                    {initial}
                                </span>
                                <span className="hidden leading-tight sm:block">
                                    <span className="block text-sm font-bold">
                                        {user?.name ?? 'Admin'}
                                    </span>
                                    <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {user?.role ?? 'admin'}
                                    </span>
                                </span>
                            </div>

                            <button
                                onClick={() => router.post('/logout')}
                                className="flex h-10 items-center gap-2 rounded-full bg-rose-50 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Keluar</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="space-y-6 p-5 lg:p-8">{children}</main>
            </div>
        </>
    );
}
