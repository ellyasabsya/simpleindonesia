import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { AppBarProps } from '../app-bar-types';

const btn =
    'flex h-11 min-w-11 items-center justify-center gap-0.5 pr-2 text-[#007AFF] active:opacity-40 dark:text-[#0A84FF]';

function BackLabel() {
    return (
        <>
            <ChevronLeft className="-ml-2 size-7" strokeWidth={2.4} />
            <span className="text-[17px]">Kembali</span>
        </>
    );
}

/**
 * Gaya iOS: bar tembus pandang (blur), judul di tengah, tombol kembali
 * bertuliskan "Kembali", dan opsi judul besar di bawahnya.
 */
export default function IosAppBar({
    title,
    back,
    leading,
    actions,
    large,
}: AppBarProps) {
    let backEl = null;
    if (typeof back === 'string') {
        backEl = (
            <Link href={back} className={btn} aria-label="Kembali">
                <BackLabel />
            </Link>
        );
    } else if (back === true) {
        backEl = (
            <button type="button" onClick={() => window.history.back()} className={btn} aria-label="Kembali">
                <BackLabel />
            </button>
        );
    }

    return (
        <header
            data-mobile-appbar="ios"
            className="sticky top-0 z-30 border-b border-black/10 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#1c1c1e]/80"
        >
            <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center px-3">
                <div className="flex justify-start">{backEl ?? leading}</div>
                <h1
                    className={`max-w-[55vw] truncate text-[17px] font-semibold text-black dark:text-white ${large ? 'opacity-0' : ''}`}
                >
                    {title}
                </h1>
                <div className="flex justify-end gap-1">{actions}</div>
            </div>
            {large && (
                <div className="px-4 pt-1 pb-2">
                    <h2 className="truncate text-[34px] leading-tight font-bold tracking-tight text-black dark:text-white">
                        {title}
                    </h2>
                </div>
            )}
        </header>
    );
}
