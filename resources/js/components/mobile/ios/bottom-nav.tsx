import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { NavItem, NavViewProps } from '../nav-types';
import { currentPath, isActive } from '../nav-utils';
import { useTyping } from '../use-typing';

// Gaya iOS: tab bar penuh selebar layar, tembus pandang (blur), garis tipis di atas,
// ikon + label kecil, warna aktif biru iOS. Tombol Beranda bulat menonjol di tengah.

const TAB =
    'flex h-[49px] min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-[3px] select-none transition-opacity active:opacity-60';

const tint = (active: boolean) =>
    active ? 'text-indigo-600 dark:text-indigo-300' : 'text-[#8E8E93]';

function Tab({ item, path }: { item: NavItem; path: string }) {
    const active = isActive(path, item);
    const Icon = item.icon;
    const cls = `${TAB} ${tint(active)}`;
    const inner = (
        <>
            <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.7} />
            <span className="text-[10px] leading-none font-medium tracking-tight">
                {item.label}
            </span>
        </>
    );

    return item.reload ? (
        <a
            href={item.href}
            className={cls}
            aria-current={active ? 'page' : undefined}
        >
            {inner}
        </a>
    ) : (
        <Link
            href={item.href}
            className={cls}
            aria-current={active ? 'page' : undefined}
        >
            {inner}
        </Link>
    );
}

export default function IosBottomNav({
    home,
    left,
    right,
    onMenu,
}: NavViewProps) {
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
            <div className="relative border-t border-black/10 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/15 dark:bg-slate-900/80">
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
                        className="group relative block h-[49px] touch-manipulation select-none"
                    >
                        <span
                            className="absolute -top-[22px] left-1/2 flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full text-white ring-[3px] ring-white/80 transition-transform duration-150 group-active:scale-90 dark:ring-slate-900/80"
                            style={{
                                backgroundImage:
                                    'linear-gradient(145deg, #32ADE6 0%, #007AFF 55%, #5856D6 100%)',
                                boxShadow:
                                    '0 6px 16px rgba(0,122,255,0.4), inset 0 1px 0 rgba(255,255,255,0.45)',
                            }}
                        >
                            <HomeGlyph className="h-[26px] w-[26px]" strokeWidth={2.2} />
                        </span>
                        <span
                            className={`absolute inset-x-0 bottom-[5px] text-center text-[10px] leading-none font-medium tracking-tight ${tint(homeActive)}`}
                        >
                            {home.label}
                        </span>
                    </Link>

                    <div className="flex min-w-0">
                        {right.map((item) => (
                            <Tab key={item.href} item={item} path={path} />
                        ))}
                        {onMenu && (
                            <button
                                type="button"
                                onClick={onMenu}
                                className={`${TAB} ${tint(false)}`}
                            >
                                <Menu className="h-6 w-6" strokeWidth={1.7} />
                                <span className="text-[10px] leading-none font-medium tracking-tight">
                                    Menu
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
