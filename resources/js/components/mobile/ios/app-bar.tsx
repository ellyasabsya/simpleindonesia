import { Link } from '@inertiajs/react';
import { ChevronLeft, Menu } from 'lucide-react';
import { openMenu, useHasMenu } from '../menu-bus';
import type { AppBarProps } from '../app-bar-types';

const btn =
    'flex h-11 min-w-11 items-center justify-center gap-0.5 pr-2 text-indigo-700 active:opacity-40 dark:text-indigo-300';

function BackLabel() {
    return (
        <>
            <ChevronLeft className="-ml-2 size-7" strokeWidth={2.4} />
            <span className="text-[15px]">Kembali</span>
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
    const hasMenu = useHasMenu();
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
            className="sticky top-0 z-30 border-b border-slate-900/[0.07] bg-[#f4f6fc] pt-[env(safe-area-inset-top)] dark:border-white/10 dark:bg-[#0a0c1a]"
        >
            <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4">
                <div className="flex justify-start">{backEl ?? leading}</div>
                <h1
                    className={`max-w-[55vw] truncate text-[17px] font-semibold text-black dark:text-white ${large ? 'opacity-0' : ''}`}
                >
                    {title}
                </h1>
                <div className="flex items-center justify-end gap-2">
                    {actions}
                    {hasMenu && (
                        <button
                            type="button"
                            onClick={openMenu}
                            aria-label="Menu"
                            className="flex size-10 items-center justify-center rounded-full text-indigo-700 transition-transform duration-150 active:scale-95 dark:text-indigo-300"
                        >
                            <Menu className="size-[22px]" strokeWidth={1.9} />
                        </button>
                    )}
                </div>
            </div>
            {large && (
                <div className="px-4 pt-1 pb-2">
                    <h2 className="truncate text-[22px] leading-tight font-semibold tracking-tight text-black dark:text-white">
                        {title}
                    </h2>
                </div>
            )}
        </header>
    );
}
