import { Link } from '@inertiajs/react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import type { AuthScreenProps } from './auth-types';
import { AuthLux } from './lux';
import AuthLogo from './logo';

// Tombol kirim berbentuk pil setinggi 56dp ala Material 3.
const submit =
    '[&_button[type=submit]]:bg-none [&_button[type=submit]]:bg-indigo-600 dark:[&_button[type=submit]]:bg-indigo-500 [&_button[type=submit]]:shadow-none [&_button[type=submit]]:h-12 [&_button[type=submit]]:rounded-full [&_button[type=submit]]:text-sm [&_button[type=submit]]:font-medium';

export default function AndroidAuth({ badge, title, subtitle, dark, toggleTheme, children }: AuthScreenProps) {
    const icon = 'flex size-12 items-center justify-center rounded-full text-white active:bg-white/20';

    return (
        <div data-mobile-auth="android" className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500">
            <AuthLux />
            <div className="px-5 pt-[env(safe-area-inset-top)]">
                <div className="-mx-2 flex h-16 items-center justify-between">
                    <Link href="/" aria-label="Kembali ke beranda" className={icon}>
                        <ArrowLeft className="size-6" />
                    </Link>
                    <button type="button" onClick={toggleTheme} aria-label="Ganti tema" className={icon}>
                        {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
                    </button>
                </div>

                <div className="pt-2 pb-12 text-white">
                    <AuthLogo size="size-12" />
                    <p className="mt-5 text-[11px] font-semibold tracking-[0.2em] text-white/80 uppercase">{badge}</p>
                    <h1 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/85">{subtitle}</p>
                </div>
            </div>

            <main
                className={`-mt-6 flex-1 rounded-t-[28px] bg-[#f4f6fc] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[#0f172a] dark:bg-[#0a0c1a] dark:text-[#f8fafc] ${submit}`}
            >
                {children}
            </main>
        </div>
    );
}
