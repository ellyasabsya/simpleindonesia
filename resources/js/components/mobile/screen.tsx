import type { ReactNode } from 'react';
import { PAGE } from './kit/soft';
import { usePlatform } from './use-platform';

type Props = {
    bar: ReactNode;
    /** true jika ada bottom nav, supaya konten paling bawah tidak tertutup. */
    bottomNav?: boolean;
    children: ReactNode;
};

/** Kerangka layar HP: latar platform, app bar di atas, konten di bawahnya. */
export default function Screen({ bar, bottomNav, children }: Props) {
    const ios = usePlatform() === 'ios';

    return (
        <div
            data-mobile-screen={ios ? 'ios' : 'android'}
            className={`min-h-dvh text-slate-900 dark:text-white ${PAGE}`}
        >
            {bar}
            <main className={`space-y-4 p-4 ${bottomNav ? 'pb-[calc(7rem+env(safe-area-inset-bottom))]' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]'}`}>
                {children}
            </main>
        </div>
    );
}
