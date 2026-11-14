import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Megaphone, Moon, Star, Sun, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import PageBackground from '@/components/page-background';
import { useTheme } from '@/hooks/use-theme';

const features = [
    { icon: UserPlus, title: 'Pendaftaran Peserta', text: 'Data peserta terkumpul rapi.', color: 'from-sky-400 to-blue-500' },
    { icon: Star, title: 'Penilaian Juri', text: 'Skor masuk langsung ke sistem.', color: 'from-fuchsia-400 to-purple-500' },
    { icon: Megaphone, title: 'Publikasi Event', text: 'Tayang setelah diperiksa admin.', color: 'from-amber-400 to-orange-500' },
];

type Props = {
    pageTitle: string;
    badge: string;
    title: string;
    subtitle: string;
    panelHeading: ReactNode;
    panelText: string;
    children: ReactNode;
};

export default function AuthLayout({ pageTitle, badge, title, subtitle, panelHeading, panelText, children }: Props) {
    const { dark, toggle } = useTheme();

    return (
        <>
            <Head title={`${pageTitle} - SIMPLE`} />
            <PageBackground />

            <button
                onClick={toggle}
                aria-label="Ganti tema"
                className="fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
                href="/"
                className="group fixed left-4 top-4 z-30 flex h-10 items-center gap-2 rounded-full bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow backdrop-blur transition hover:bg-white hover:text-indigo-700 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:hover:text-white"
            >
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                Halaman Utama
            </Link>

            <div className="relative z-10 min-h-screen text-slate-900 dark:text-white">
                <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-6 py-10 lg:grid-cols-[0.95fr_1fr]">
                    {/* Panel brand */}
                    <aside className="relative hidden overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 p-10 text-white shadow-xl shadow-indigo-900/20 lg:block">
                        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10" />
                        <div className="absolute -bottom-24 -left-12 h-60 w-60 rounded-full bg-fuchsia-400/20 blur-2xl" />

                        <div className="relative">
                            <Link href="/" className="flex items-center gap-2.5">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl font-black ring-1 ring-white/30">
                                    S
                                </span>
                                <span className="text-xl font-extrabold tracking-[0.25em]">SIMPLE</span>
                            </Link>

                            <h2 className="mt-12 text-4xl font-black leading-tight">{panelHeading}</h2>
                            <p className="mt-5 text-base leading-relaxed text-blue-50/90">{panelText}</p>

                            <div className="mt-10 space-y-3.5">
                                {features.map(({ icon: Icon, title: t, text, color }) => (
                                    <div key={t} className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur">
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-[15px] font-bold">{t}</p>
                                            <p className="text-sm text-blue-50/80">{text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Kartu form */}
                    <main>
                        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-7 shadow-xl shadow-indigo-900/10 backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-slate-900/70">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-900 shadow-sm dark:bg-white/10 dark:text-indigo-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-700 dark:bg-indigo-300" />
                                {badge}
                            </span>
                            <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">{title}</h1>
                            <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-300">{subtitle}</p>

                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
