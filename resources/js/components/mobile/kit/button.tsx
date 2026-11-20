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

const BRAND = 'bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-600/30';
const TONAL = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-100';

const IOS = {
    base: 'inline-flex items-center justify-center gap-2 text-[17px] font-semibold transition active:opacity-70',
    filled: `h-[50px] rounded-[14px] px-5 ${BRAND}`,
    tonal: `h-[50px] rounded-[14px] px-5 ${TONAL}`,
    plain: 'h-11 px-3 font-normal text-indigo-600 dark:text-indigo-300',
};
const ANDROID = {
    base: 'inline-flex items-center justify-center gap-2 text-sm font-semibold transition active:opacity-80',
    filled: `h-11 rounded-full px-6 ${BRAND}`,
    tonal: `h-11 rounded-full px-6 ${TONAL}`,
    plain: 'h-11 px-3 text-indigo-700 dark:text-indigo-300',
};

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
