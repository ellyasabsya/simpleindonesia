import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { usePlatform } from '../use-platform';

type SectionProps = { title?: string; footer?: ReactNode; children: ReactNode };

/** Kelompok daftar: "inset grouped" di iOS, permukaan tonal Material 3 di Android. */
export function Section({ title, footer, children }: SectionProps) {
    const ios = usePlatform() === 'ios';

    return (
        <section>
            {title && (
                <h2
                    className={
                        ios
                            ? 'mb-1.5 px-4 text-[13px] text-black/50 uppercase dark:text-white/50'
                            : 'px-4 pb-2 text-sm font-medium text-[#6750A4] dark:text-[#d0bcff]'
                    }
                >
                    {title}
                </h2>
            )}
            <div
                className={
                    ios
                        ? 'divide-y divide-black/10 overflow-hidden rounded-[12px] bg-white dark:divide-white/10 dark:bg-[#1c1c1e]'
                        : 'overflow-hidden rounded-[20px] bg-[#f3edf7] dark:bg-[#211f26]'
                }
            >
                {children}
            </div>
            {footer && (
                <p className={ios ? 'mt-1.5 px-4 text-[13px] text-black/50 dark:text-white/50' : 'mt-2 px-4 text-xs text-[#49454f] dark:text-[#cac4d0]'}>
                    {footer}
                </p>
            )}
        </section>
    );
}

type RowProps = {
    icon?: MenuIcon;
    /** Warna ikon (hex 6 digit). */
    tint?: string;
    /** Ganti ikon dengan elemen sendiri (mis. foto profil). */
    leading?: ReactNode;
    label: ReactNode;
    sub?: ReactNode;
    value?: ReactNode;
    badge?: number;
    href?: string;
    /** true = tautan biasa (muat ulang halaman), bukan navigasi Inertia. */
    external?: boolean;
    onClick?: () => void;
};

/** Satu baris daftar: ikon, teks, nilai di kanan, dan panah jika bisa diketuk ke halaman lain. */
export function Row({ icon: Icon, tint = '#007AFF', leading, label, sub, value, badge, href, external, onClick }: RowProps) {
    const ios = usePlatform() === 'ios';
    const interactive = Boolean(href || onClick);

    const cls = ios
        ? `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-[17px] text-black dark:text-white ${interactive ? 'active:bg-black/5 dark:active:bg-white/10' : ''}`
        : `flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left text-base text-[#1d1b20] dark:text-[#e6e0e9] ${interactive ? 'active:bg-black/10 dark:active:bg-white/10' : ''}`;

    let lead: ReactNode = leading ?? null;
    if (!lead && Icon) {
        lead = ios ? (
            <span style={{ backgroundColor: tint }} className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] text-white">
                <Icon className="size-[18px]" />
            </span>
        ) : (
            <span style={{ backgroundColor: `${tint}22`, color: tint }} className="flex size-10 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-5" />
            </span>
        );
    }

    const body = (
        <>
            {lead}
            <span className="min-w-0 flex-1">
                <span className="block truncate">{label}</span>
                {sub && (
                    <span className={`block truncate ${ios ? 'text-[13px] text-black/50 dark:text-white/50' : 'text-sm text-[#49454f] dark:text-[#cac4d0]'}`}>
                        {sub}
                    </span>
                )}
            </span>
            {value && (
                <span className={`max-w-[45%] shrink-0 truncate ${ios ? 'text-[17px] text-black/50 dark:text-white/50' : 'text-sm text-[#49454f] dark:text-[#cac4d0]'}`}>
                    {value}
                </span>
            )}
            {badge !== undefined && badge > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${ios ? 'bg-[#FF3B30]' : 'bg-[#b3261e]'}`}>{badge}</span>
            )}
            {ios && href && <ChevronRight className="size-4 shrink-0 text-black/25 dark:text-white/30" />}
        </>
    );

    if (href) {
        return external ? (
            <a href={href} className={cls}>
                {body}
            </a>
        ) : (
            <Link href={href} className={cls}>
                {body}
            </Link>
        );
    }
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cls}>
                {body}
            </button>
        );
    }
    return <div className={cls}>{body}</div>;
}
