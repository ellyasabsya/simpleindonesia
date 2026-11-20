import { Link } from '@inertiajs/react';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import type { AuthScreenProps } from './auth-types';

// Tombol kirim dibuat besar dan membulat ala iOS tanpa mengubah komponen form.
const submit =
    '[&_button[type=submit]]:h-[52px] [&_button[type=submit]]:rounded-[14px] [&_button[type=submit]]:text-[17px] [&_button[type=submit]]:font-semibold';

export default function IosAuth({ badge, title, subtitle, dark, toggleTheme, children }: AuthScreenProps) {
    return (
        <div
            data-mobile-auth="ios"
            className="min-h-dvh bg-[#f2f2f7] pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-black dark:bg-black dark:text-white"
        >
            <div className="flex h-11 items-center justify-between px-3">
                <Link href="/" className="flex h-11 items-center text-[17px] text-[#007AFF] active:opacity-40 dark:text-[#0A84FF]">
                    <ChevronLeft className="-ml-1 size-7" strokeWidth={2.4} />
                    Beranda
                </Link>
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Ganti tema"
                    className="flex size-11 items-center justify-center text-[#007AFF] active:opacity-40 dark:text-[#0A84FF]"
                >
                    {dark ? <Sun className="size-[22px]" /> : <Moon className="size-[22px]" />}
                </button>
            </div>

            <main className="px-6 pt-6">
                <span className="flex size-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-700 text-3xl font-black text-white shadow-lg shadow-indigo-700/30">
                    S
                </span>
                <p className="mt-6 text-[13px] font-semibold tracking-wide text-[#007AFF] uppercase dark:text-[#0A84FF]">
                    {badge}
                </p>
                <h1 className="mt-1 text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
                <p className="mt-2 text-[17px] leading-snug text-black/55 dark:text-white/60">{subtitle}</p>

                <div className={`mt-8 ${submit}`}>{children}</div>
            </main>
        </div>
    );
}
