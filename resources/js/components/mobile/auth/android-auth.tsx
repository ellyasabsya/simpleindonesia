import { Link } from '@inertiajs/react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import type { AuthScreenProps } from './auth-types';

// Tombol kirim berbentuk pil setinggi 56dp ala Material 3.
const submit =
    '[&_button[type=submit]]:h-14 [&_button[type=submit]]:rounded-full [&_button[type=submit]]:text-base [&_button[type=submit]]:font-medium';

export default function AndroidAuth({ badge, title, subtitle, dark, toggleTheme, children }: AuthScreenProps) {
    const icon = 'flex size-12 items-center justify-center rounded-full text-white active:bg-white/20';

    return (
        <div data-mobile-auth="android" className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600">
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
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black ring-1 ring-white/30">
                        S
                    </span>
                    <p className="mt-5 text-xs font-medium tracking-widest text-white/80 uppercase">{badge}</p>
                    <h1 className="mt-1 text-[32px] leading-tight font-medium">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-white/85">{subtitle}</p>
                </div>
            </div>

            <main
                className={`-mt-6 flex-1 rounded-t-[28px] bg-[#f4f6fb] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[#0f172a] dark:bg-[#0b1020] dark:text-[#f8fafc] ${submit}`}
            >
                {children}
            </main>
        </div>
    );
}
