import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { usePlatform } from '../use-platform';

type Props = {
    variant?: 'filled' | 'tonal' | 'plain';
    icon?: MenuIcon;
    /** Selebar penuh. */
    full?: boolean;
    href?: string;
    onClick?: () => void;
    children: ReactNode;
};

const BRAND = 'bg-indigo-600 text-white dark:bg-indigo-500';
const TONAL = 'bg-slate-900/[0.05] text-indigo-700 dark:bg-white/[0.08] dark:text-indigo-200';

const SET = {
    base: 'inline-flex items-center justify-center gap-2 text-sm font-medium transition-transform duration-150 active:scale-[0.98]',
    filled: `h-12 rounded-full px-6 ${BRAND}`,
    tonal: `h-12 rounded-full px-6 ${TONAL}`,
    plain: 'h-11 px-3 text-indigo-700 dark:text-indigo-300',
};
const IOS = SET;
const ANDROID = SET;

/** Tombol bermerek: gradien indigo-biru-violet seperti di web, bentuk mengikuti platform. */
export default function Button({ variant = 'filled', icon: Icon, full, href, onClick, children }: Props) {
    const set = usePlatform() === 'ios' ? IOS : ANDROID;
    const cls = `${set.base} ${set[variant]} ${full ? 'w-full' : ''} [&_svg]:size-[18px]`;
    const inner = (
        <>
            {Icon && <Icon />}
            {children}
        </>
    );

    return href ? (
        <Link href={href} className={cls}>
            {inner}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls}>
            {inner}
        </button>
    );
}
