import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { AppBarProps } from '../app-bar-types';

const btn =
    'flex size-12 items-center justify-center rounded-full text-[#0f172a] active:bg-black/10 dark:text-[#f8fafc] dark:active:bg-white/15';

/**
 * Gaya Android (Material 3): top app bar setinggi 64dp, tombol kembali
 * berupa panah, judul rata kiri, dan latar permukaan solid.
 */
export default function AndroidAppBar({
    title,
    back,
    leading,
    actions,
}: AppBarProps) {
    let backEl = null;
    if (typeof back === 'string') {
        backEl = (
            <Link href={back} className={btn} aria-label="Kembali">
                <ArrowLeft className="size-6" />
            </Link>
        );
    } else if (back === true) {
        backEl = (
            <button type="button" onClick={() => window.history.back()} className={btn} aria-label="Kembali">
                <ArrowLeft className="size-6" />
            </button>
        );
    }

    return (
        <header
            data-mobile-appbar="android"
            className="sticky top-0 z-30 border-b border-slate-900/[0.07] bg-[#f4f6fc]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0c1a]/90"
        >
            <div className="flex h-16 items-center gap-1 px-1">
                {backEl ?? leading}
                <h1 className="min-w-0 flex-1 truncate px-3 text-[17px] font-semibold tracking-tight text-[#0f172a] dark:text-[#f8fafc]">
                    {title}
                </h1>
                <div className="flex items-center">{actions}</div>
            </div>
        </header>
    );
}
