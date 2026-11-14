import { Link } from '@inertiajs/react';
import { goTo } from '@/lib/scroll';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';

const links = [
    { label: 'Hero', id: 'hero' },
    { label: 'Event', id: 'event' },
    { label: 'Tiket', id: 'tiket' },
    { label: 'Voting', id: 'voting' },
    { label: 'Paket', id: 'paket' },
    { label: 'Berita', id: 'berita' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState('hero');
    const { dark, toggle } = useTheme();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Tandai menu aktif sesuai section yang sedang terlihat
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
            { rootMargin: '-45% 0px -50% 0px' },
        );
        links.forEach((l) => {
            const el = document.getElementById(l.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/90'
                    : 'border-b border-transparent bg-transparent'
            }`}
        >
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <a href="#hero" onClick={(e) => goTo(e, "hero")} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">
                        S
                    </span>
                    <span className="text-xl font-extrabold tracking-[0.2em] text-indigo-900 dark:text-white">
                        SIMPLE
                    </span>
                </a>

                <nav className="hidden rounded-full bg-white/60 p-1.5 shadow-sm backdrop-blur md:flex dark:bg-white/5">
                    {links.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`} onClick={(e) => goTo(e, link.id)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                                active === link.id
                                    ? 'bg-white text-indigo-900 shadow dark:bg-slate-700 dark:text-white'
                                    : 'text-slate-600 hover:text-indigo-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggle}
                        aria-label="Ganti tema"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                    >
                        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <Link
                        href="/login"
                        className="rounded-full bg-indigo-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        Masuk
                    </Link>
                </div>
            </div>
        </header>
    );
}
