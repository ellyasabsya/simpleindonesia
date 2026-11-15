import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import PageBackground from '@/components/page-background';
import { useTheme } from '@/hooks/use-theme';

export default function UserLayout({ title, hasPanel, children }: { title: string; hasPanel: boolean; children: ReactNode }) {
    const { dark, toggle } = useTheme();
    const [open, setOpen] = useState(false);
    const user = usePage<{ auth?: { user?: { name?: string; email?: string } } }>().props.auth?.user;
    const name = user?.name ?? 'Pengguna';

    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <PageBackground />

            <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-indigo-950/40">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">S</span>
                        <span className="text-xl font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">SIMPLE</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button onClick={toggle} aria-label="Ganti tema" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <div className="relative">
                            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                                <span className="hidden text-sm font-bold sm:block">{name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {open && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/70 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                                        <div className="px-3 py-2">
                                            <p className="truncate text-sm font-bold">{name}</p>
                                            <p className="truncate text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                        <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                                        </Link>
                                        <Link href={hasPanel ? '/panel' : '/lembaga/daftar'} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                                            <Building2 className="h-4 w-4" /> {hasPanel ? 'Panel Lembaga' : 'Daftarkan Lembaga'}
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
                <main className="mx-auto max-w-7xl space-y-6 px-6 pb-16 pt-28">{children}</main>
            </div>
        </>
    );
}
