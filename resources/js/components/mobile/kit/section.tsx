import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { CARD, MUTED } from './soft';

type SectionProps = { title?: string; footer?: ReactNode; children: ReactNode };

/** Kelompok daftar: satu kartu bergaris tipis, baris dipisah garis tipis. */
export function Section({ title, footer, children }: SectionProps) {
    return (
        <section>
            {title && <h2 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{title}</h2>}
            <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>{children}</div>
            {footer && <p className={'mt-2 px-1 text-xs ' + MUTED}>{footer}</p>}
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
    background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 88%, white), color-mix(in srgb, ${tint} 80%, black))`,
    boxShadow: `0 6px 14px -4px ${tint}, inset 0 1px 0 rgba(255,255,255,.35)`,
});

/** Satu baris daftar: ikon berwarna, teks, nilai di kanan, panah bila bisa diketuk. */
export function Row({ icon: Icon, tint = '#4F46E5', leading, label, sub, value, badge, href, external, onClick }: RowProps) {
    const interactive = Boolean(href || onClick);
    const cls =
        'flex min-h-14 w-full items-center gap-3.5 px-4 py-2.5 text-left text-slate-900 dark:text-white ' +
        (interactive ? 'transition-colors active:bg-slate-900/[0.04] dark:active:bg-white/10' : '');

    let lead: ReactNode = leading ?? null;
    if (!lead && Icon) {
        lead = (
            <span style={tile(tint)} className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white">
                <Icon className="size-5" />
            </span>
        );
    }

    const body = (
        <>
            {lead}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-base leading-snug font-medium">{label}</span>
                {sub && <span className={'block truncate text-xs ' + MUTED}>{sub}</span>}
            </span>
            {value && <span className={'max-w-[45%] shrink-0 truncate text-[13px] ' + MUTED}>{value}</span>}
            {badge !== undefined && badge > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>}
            {href && <ChevronRight className={'size-4 shrink-0 ' + MUTED} />}
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
