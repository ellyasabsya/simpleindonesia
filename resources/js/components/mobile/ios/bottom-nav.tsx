import { Link, usePage } from '@inertiajs/react';
import type { NavItem, NavViewProps } from '../nav-types';
import { currentPath, isActive } from '../nav-utils';
import { useTyping } from '../use-typing';

// Gaya iOS + Premium Elegant: tab bar selebar layar, krem tembus pandang (blur), garis tipis di atas,
// ikon + label kecil. Menu aktif berwarna emas dengan garis penanda. Tombol Beranda bulat emas di tengah.

const TAB =
    'relative flex h-[52px] min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-[3px] select-none transition-opacity active:opacity-60';

const tint = (active: boolean) =>
    active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400';

const LABEL = (active: boolean) =>
    `text-[10px] leading-none tracking-tight ${active ? 'font-semibold' : 'font-medium'}`;

function Tab({ item, path }: { item: NavItem; path: string }) {
    const active = isActive(path, item);
    const Icon = item.icon;
    const cls = `${TAB} ${tint(active)}`;
    const inner = (
        <>
            {active && (
                <span aria-hidden className="absolute top-0 h-[2px] w-7 rounded-full bg-gradient-to-r from-indigo-300 via-indigo-600 to-indigo-300" />
            )}
            <Icon className="h-6 w-6" strokeWidth={active ? 1.9 : 1.5} active={active} />
            <span className={LABEL(active)}>{item.label}</span>
        </>
    );

    return item.reload ? (
        <a href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
            {inner}
        </a>
    ) : (
        <Link href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
            {inner}
        </Link>
    );
}

export default function IosBottomNav({ home, left, right }: NavViewProps) {
    const { url } = usePage();
    const path = currentPath(url);
    const typing = useTyping();
    const homeActive = isActive(path, home);
    const HomeGlyph = home.icon;

    return (
        <nav
            aria-label="Navigasi utama"
            data-mobile-nav
            className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-200 motion-reduce:transition-none md:hidden print:hidden ${
                typing ? 'translate-y-[calc(100%+2rem)]' : ''
            }`}
        >
            <div className="relative border-t border-slate-900/10 bg-[#f4f6fc] pb-[env(safe-area-inset-bottom)] dark:border-white/10 dark:bg-[#0a0c1a]">
                <div className="grid grid-cols-[1fr_4.5rem_1fr]">
                    <div className="flex min-w-0">
                        {left.map((item) => (
                            <Tab key={item.href} item={item} path={path} />
                        ))}
                    </div>

                    <Link
                        href={home.href}
                        aria-label={home.label}
                        aria-current={homeActive ? 'page' : undefined}
                        className="group relative block h-[52px] touch-manipulation select-none"
                    >
                        <span
                            className="absolute -top-[22px] left-1/2 flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full text-white ring-[3px] ring-[#f4f6fc] transition-transform duration-150 group-active:scale-90 dark:ring-[#0a0c1a]"
                            style={{
                                backgroundImage: 'linear-gradient(145deg, #818cf8 0%, #4f46e5 55%, #3730a3 100%)',
                                boxShadow: '0 8px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.45)',
                            }}
                        >
                            <HomeGlyph className="h-[26px] w-[26px]" strokeWidth={2.2} />
                        </span>
                        <span className={`absolute inset-x-0 bottom-[6px] text-center ${LABEL(homeActive)} ${tint(homeActive)}`}>{home.label}</span>
                    </Link>

                    <div className="flex min-w-0">
                        {right.map((item) => (
                            <Tab key={item.href} item={item} path={path} />
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
