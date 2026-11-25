import type { ReactNode } from 'react';
import { PRESS } from './kit/soft';

type Props = { onClick: () => void; label: string; children: ReactNode };

/** Tombol ikon di app bar: satu gaya untuk iOS dan Android. */
export default function AppBarButton({ onClick, label, children }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={'flex size-10 items-center justify-center rounded-full text-indigo-700 dark:text-indigo-300 [&_svg]:size-[22px] ' + PRESS}
        >
            {children}
        </button>
    );
}
