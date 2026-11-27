import { Link } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { CARD, FIELD, MUTED, PAGE, PRESS } from '../kit/soft';

type Props = { back?: string; badge: string; title: string; subtitle: string; footer?: ReactNode; children: ReactNode };

/** Kerangka auth HP: merek, judul, kartu isian, tautan bawah. Tanpa bottom nav. */
export default function AuthMobile({ back, badge, title, subtitle, footer, children }: Props) {
    return (
        <div className={'flex min-h-dvh flex-col px-5 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-slate-900 dark:text-white ' + PAGE}>
            <div className="flex items-center gap-2.5 px-1">
                {back && (
                    <Link href={back} aria-label="Kembali" className={'flex size-10 shrink-0 items-center justify-center rounded-full text-slate-900 dark:text-white ' + CARD + ' ' + PRESS}>
                        <ArrowLeft className="size-5" />
                    </Link>
                )}
                <img src="/logo-s-sm.png" alt="SIMPLE" className="size-9 shrink-0 object-contain" />
                <span className="text-base font-semibold tracking-[0.2em]">SIMPLE</span>
            </div>

            <header className="mt-8 space-y-1.5 px-1">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{badge}</p>
                <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
                <p className={'text-[13px] leading-relaxed ' + MUTED}>{subtitle}</p>
            </header>

            <section className={'mt-6 space-y-4 rounded-3xl p-4 ' + CARD}>{children}</section>

            {footer && <p className={'mt-6 text-center text-sm ' + MUTED}>{footer}</p>}
        </div>
    );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon: MenuIcon; error?: string; optional?: boolean };

export function MField({ label, icon: Icon, error, optional, ...rest }: FieldProps) {
    return (
        <div>
            <label className={'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED}>
                {label}
                {optional && <span className="ml-1 font-normal opacity-70">(opsional)</span>}
            </label>
            <div className="relative">
                <Icon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-indigo-500 dark:text-indigo-300" />
                <input {...rest} className={'h-12 w-full rounded-2xl pr-4 pl-11 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/25 ' + FIELD} />
            </div>
            {error && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}

export function MSubmit({ processing, children }: { processing: boolean; children: ReactNode }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}
        >
            {processing && <Loader2 className="size-4 animate-spin" />}
            {children}
        </button>
    );
}

export const NOTICE_OK = 'flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-[13px] font-medium text-emerald-800 dark:text-emerald-200';
export const NOTICE_WARN = 'rounded-2xl bg-amber-500/10 px-4 py-3 text-[13px] font-medium text-amber-900 dark:text-amber-200';
