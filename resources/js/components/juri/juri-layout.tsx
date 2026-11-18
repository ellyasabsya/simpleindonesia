import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import PageBackground from '@/components/page-background';
import Avatar from '@/components/user/avatar';
import { useTheme } from '@/hooks/use-theme';

export default function JuriLayout({ title, judgeName, children }: { title: string; judgeName: string; children: ReactNode }) {
    const { dark, toggle } = useTheme();

    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <PageBackground />

            <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-indigo-950/40">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">S</span>
                        <span className="text-xl font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">SIMPLE</span>
                        <span className="ml-1 hidden rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700 shadow-sm sm:inline dark:bg-white/10 dark:text-indigo-200">Penilaian juri</span>
                    </div>

                    <div className="flex items-center gap-3">
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
                <main className="mx-auto max-w-7xl space-y-6 px-6 pb-16 pt-28">{children}</main>
            </div>
        </>
    );
}
