import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import PageBackground from '@/components/page-background';
import Avatar from '@/components/user/avatar';
import { useTheme } from '@/hooks/use-theme';
import JuriScreen from '@/components/mobile/juri/juri-screen';
import { usePhone } from '@/components/mobile/use-phone';

export default function JuriLayout({ title, judgeName, children }: { title: string; judgeName: string; children: ReactNode }) {
    const { dark, toggle } = useTheme();
    const loggedIn = Boolean(usePage<{ auth?: { user?: unknown } }>().props.auth?.user);
    const phone = usePhone();

    if (phone) {
        return (
            <JuriScreen title={title} judgeName={judgeName} loggedIn={loggedIn} dark={dark} toggleTheme={toggle}>
                {children}
            </JuriScreen>
        );
    }

    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <PageBackground />

            <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-indigo-950/40">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">S</span>
                        <span className="text-xl font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">SIMPLE</span>
                        <span className="ml-1 hidden rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700 shadow-sm sm:inline dark:bg-white/10 dark:text-indigo-200">Penilaian juri</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {loggedIn && (
                            <Link
                                href="/juri-saya"
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/30 ring-1 ring-white/30 transition hover:-translate-y-0.5"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Panel juri</span>
                            </Link>
                        )}
                        <button onClick={toggle} aria-label="Ganti tema" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <div className="flex items-center gap-2.5 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm dark:bg-white/10">
                            <Avatar name={judgeName} src={null} className="h-9 w-9 rounded-full text-sm" />
                            <span className="hidden max-w-[12rem] truncate text-sm font-bold sm:block">{judgeName}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative z-10 min-h-screen text-slate-900 dark:text-white">
                <main className="mx-auto max-w-7xl space-y-6 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(5.5rem+env(safe-area-inset-top))] md:px-6 md:pb-16 md:pt-28">{children}</main>
            </div>
        </>
    );
}
