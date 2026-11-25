import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { PAGE, PRESS } from '../kit/soft';
import type { AuthScreenProps } from './auth-types';
import AuthLogo from './logo';
import { AuthLux } from './lux';

// Tombol kirim: pil indigo solid, sama dengan tombol di beranda.
const submit = [
    '[&_button[type=submit]]:h-12',
    '[&_button[type=submit]]:rounded-full',
    '[&_button[type=submit]]:bg-none',
    '[&_button[type=submit]]:bg-indigo-600',
    'dark:[&_button[type=submit]]:bg-indigo-500',
    '[&_button[type=submit]]:py-0',
    '[&_button[type=submit]]:text-sm',
    '[&_button[type=submit]]:font-medium',
].join(' ');

const glass = 'flex size-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md ' + PRESS;

/** Layar login/daftar HP: hero indigo di atas, sheet form melengkung di bawah. */
export default function AuthScreen({ pageTitle, badge, title, subtitle, dark, toggleTheme, children }: AuthScreenProps) {
    return (
        <>
            <Head title={`${pageTitle} - SIMPLE`} />
            <div data-mobile-auth="unified" className={'flex min-h-dvh flex-col text-slate-900 dark:text-white ' + PAGE}>
                <AuthLux />

                <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 pt-[env(safe-area-inset-top)] pb-14 text-white">
                    <span aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[length:14px_14px]" />
                    <span aria-hidden className="absolute -top-16 -right-14 size-56 rounded-full bg-white/10 blur-2xl" />
                    <span aria-hidden className="absolute -bottom-20 -left-10 size-48 rounded-full bg-violet-300/20 blur-2xl" />

                    <div className="relative flex h-16 items-center justify-between">
                        <Link href="/" aria-label="Kembali ke beranda" className={glass}>
                            <ChevronLeft className="size-5" strokeWidth={2.2} />
                        </Link>
                        <button type="button" onClick={toggleTheme} aria-label="Ganti tema" className={glass}>
                            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>
                    </div>

                    <div className="relative pt-2">
                        <AuthLogo size="size-12" />
                        <p className="mt-5 text-[11px] font-semibold tracking-[0.2em] text-indigo-100 uppercase">{badge}</p>
                        <h1 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-tight text-white">{title}</h1>
                        <p className="mt-2 text-[13px] leading-relaxed text-white/80">{subtitle}</p>
                    </div>
                </header>

                <main
                    className={
                        'relative z-10 -mt-7 flex-1 rounded-t-[32px] bg-white px-5 pt-7 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-18px_rgba(30,27,75,0.45)] dark:bg-[#10132b] [&>*:first-child]:mt-0 [&>form:first-child]:mt-0 ' +
                        submit
                    }
                >
                    {children}
                </main>
            </div>
        </>
    );
}
