import { goTo } from '@/lib/scroll';
const links = ['Hero', 'Event', 'Tiket', 'Voting', 'Paket', 'Berita'];

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white/60 py-10 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 font-black text-white">
                        S
                    </span>
                    <span className="font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">SIMPLE</span>
                </div>

                <nav className="flex flex-wrap gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {links.map((label) => (
                        <a key={label} href={`#${label.toLowerCase()}`} onClick={(e) => goTo(e, label.toLowerCase())} className="hover:text-indigo-700 dark:hover:text-white">
                            {label}
                        </a>
                    ))}
                </nav>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                    © {new Date().getFullYear()} SIMPLE. Semua hak dilindungi.
                </p>
            </div>
        </footer>
    );
}
