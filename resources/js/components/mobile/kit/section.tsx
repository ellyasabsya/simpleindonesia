import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { usePlatform } from '../use-platform';

type SectionProps = { title?: string; footer?: ReactNode; children: ReactNode };

/** Kelompok daftar: kartu putih berbatas jelas. iOS memakai sudut 12, Android sudut 20. */
export function Section({ title, footer, children }: SectionProps) {
    const ios = usePlatform() === 'ios';

    return (
        <section>
            {title && (
                <h2
                    className={
                        ios
                            ? 'mb-1.5 px-4 text-[13px] font-medium text-slate-500 uppercase dark:text-slate-400'
                            : 'px-4 pb-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300'
                    }
                >
                    {title}
                </h2>
            )}
            <div
                className={
                    ios
                        ? 'divide-y divide-slate-200/80 overflow-hidden rounded-[12px] bg-white shadow-sm ring-1 ring-slate-200/60 dark:divide-white/10 dark:bg-[#1c1c1e] dark:ring-white/5'
                        : 'divide-y divide-slate-100 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-sm dark:divide-white/5 dark:border-white/10 dark:bg-slate-900'
                }
            >
                {children}
            </div>
            {footer && <p className={ios ? 'mt-1.5 px-4 text-[13px] text-slate-500 dark:text-slate-400' : 'mt-2 px-4 text-xs text-slate-600 dark:text-slate-300'}>{footer}</p>}
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

const tile = (tint: string) => ({
    background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 72%, white), ${tint})`,
    boxShadow: `0 4px 10px -4px ${tint}`,
});

/** Satu baris daftar: ikon bergradien, teks, nilai di kanan, dan panah jika bisa diketuk ke halaman lain. */
export function Row({ icon: Icon, tint = '#2563eb', leading, label, sub, value, badge, href, external, onClick }: RowProps) {
    const ios = usePlatform() === 'ios';
    const interactive = Boolean(href || onClick);

    const cls = ios
        ? `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-[17px] text-slate-900 dark:text-white ${interactive ? 'active:bg-slate-100 dark:active:bg-white/10' : ''}`
        : `flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left text-base text-slate-900 dark:text-white ${interactive ? 'active:bg-indigo-50 dark:active:bg-white/10' : ''}`;

    let lead: ReactNode = leading ?? null;
    if (!lead && Icon) {
        lead = (
            <span style={tile(tint)} className={`flex shrink-0 items-center justify-center text-white ${ios ? 'size-[30px] rounded-[8px]' : 'size-11 rounded-2xl'}`}>
                <Icon className={ios ? 'size-[18px]' : 'size-5'} />
            </span>
        );
    }

    const subCls = ios ? 'text-[13px] text-slate-500 dark:text-slate-400' : 'text-sm text-slate-600 dark:text-slate-300';
    const body = (
        <>
            {lead}
            <span className="min-w-0 flex-1">
                <span className="block truncate">{label}</span>
                {sub && <span className={`block truncate ${subCls}`}>{sub}</span>}
            </span>
            {value && <span className={`max-w-[45%] shrink-0 truncate ${ios ? 'text-[17px] text-slate-500 dark:text-slate-400' : 'text-sm font-medium text-slate-600 dark:text-slate-300'}`}>{value}</span>}
            {badge !== undefined && badge > 0 && <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${ios ? 'bg-[#FF3B30]' : 'bg-[#dc2626]'}`}>{badge}</span>}
            {href && <ChevronRight className="size-4 shrink-0 text-slate-300 dark:text-white/30" />}
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
