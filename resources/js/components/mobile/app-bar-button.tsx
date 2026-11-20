import type { ReactNode } from 'react';
import { usePlatform } from './use-platform';

type Props = { onClick: () => void; label: string; children: ReactNode };

/** Tombol ikon di app bar: teks biru tanpa latar di iOS, lingkaran 48dp di Android. */
export default function AppBarButton({ onClick, label, children }: Props) {
    const ios = usePlatform() === 'ios';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={
                ios
                    ? 'flex h-11 min-w-11 items-center justify-center text-[#007AFF] active:opacity-40 dark:text-[#0A84FF] [&_svg]:size-[22px]'
                    : 'flex size-12 items-center justify-center rounded-full text-[#0f172a] active:bg-black/10 dark:text-[#f8fafc] dark:active:bg-white/15 [&_svg]:size-6'
            }
        >
            {children}
        </button>
    );
}
