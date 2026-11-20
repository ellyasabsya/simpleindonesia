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

const IOS = {
    base: 'inline-flex items-center justify-center gap-2 text-[17px] font-semibold transition active:opacity-60',
    filled: 'h-[50px] rounded-[14px] bg-[#007AFF] px-5 text-white dark:bg-[#0A84FF]',
    tonal: 'h-[50px] rounded-[14px] bg-[#007AFF]/15 px-5 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]',
    plain: 'h-11 px-3 font-normal text-[#007AFF] dark:text-[#0A84FF]',
};
const ANDROID = {
    base: 'inline-flex items-center justify-center gap-2 text-sm font-medium transition active:opacity-80',
    filled: 'h-10 rounded-full bg-[#6750A4] px-6 text-white dark:bg-[#d0bcff] dark:text-[#381e72]',
    tonal: 'h-10 rounded-full bg-[#e8def8] px-6 text-[#1d192b] dark:bg-[#4a4458] dark:text-[#e8def8]',
    plain: 'h-10 px-3 text-[#6750A4] dark:text-[#d0bcff]',
};

/** Tombol native: biru iOS membulat 14pt, atau tombol pil Material 3. */
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
