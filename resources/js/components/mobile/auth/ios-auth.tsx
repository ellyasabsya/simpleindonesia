import { Link } from '@inertiajs/react';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import type { AuthScreenProps } from './auth-types';
import { AuthLux } from './lux';
import AuthLogo from './logo';

// Tombol kirim dibuat besar dan membulat ala iOS tanpa mengubah komponen form.
const submit =
    '[&_button[type=submit]]:bg-none [&_button[type=submit]]:bg-indigo-600 dark:[&_button[type=submit]]:bg-indigo-500 [&_button[type=submit]]:shadow-none [&_button[type=submit]]:h-12 [&_button[type=submit]]:rounded-[14px] [&_button[type=submit]]:text-sm [&_button[type=submit]]:font-medium';

export default function IosAuth({ badge, title, subtitle, dark, toggleTheme, children }: AuthScreenProps) {
    return (
        <div
            data-mobile-auth="ios"
            className="min-h-dvh bg-[#f4f6fc] pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-black dark:bg-[#0a0c1a] dark:text-white"
        >
            <AuthLux />
            <div className="flex h-11 items-center justify-between px-3">
                <Link href="/" className="flex h-11 items-center text-[17px] text-indigo-700 active:opacity-40 dark:text-indigo-300">
                    <ChevronLeft className="-ml-1 size-7" strokeWidth={2.4} />
                    Beranda
                </Link>
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Ganti tema"
                    className="flex size-11 items-center justify-center text-indigo-700 active:opacity-40 dark:text-indigo-300"
                >
                    {dark ? <Sun className="size-[22px]" /> : <Moon className="size-[22px]" />}
                </button>
            </div>

            <main className="px-6 pt-6">
                <AuthLogo size="size-12" />
                <p className="mt-6 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">
                    {badge}
                </p>
                <h1 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
                <p className="mt-2 text-[13px] leading-relaxed text-black/55 dark:text-white/60">{subtitle}</p>

                <div className={`mt-8 ${submit}`}>{children}</div>
            </main>
        </div>
    );
}
