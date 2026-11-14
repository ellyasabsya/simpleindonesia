import { Head, router, usePage } from '@inertiajs/react';
import PageBackground from '@/components/page-background';

export default function DashboardShell({ heading }: { heading: string }) {
    const { auth } = usePage<{ auth: { user: { name: string; email: string; role: string } } }>().props;

    return (
        <>
            <Head title={heading} />
            <PageBackground />
            <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center px-6 text-slate-900 dark:text-white">
                <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-10 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
                    <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-indigo-900 dark:bg-white/10 dark:text-indigo-200">
                        {auth.user.role}
                    </span>
                    <h1 className="title-gradient mt-5 text-4xl font-black">{heading}</h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        Halo, <b>{auth.user.name}</b> ({auth.user.email}). Halaman ini akan kita isi di tahap berikutnya.
                    </p>
                    <button
                        onClick={() => router.post('/logout')}
                        className="mt-8 rounded-2xl bg-indigo-900 px-6 py-3 font-bold text-white transition hover:bg-indigo-800"
                    >
                        Keluar
                    </button>
                </div>
            </div>
        </>
    );
}
