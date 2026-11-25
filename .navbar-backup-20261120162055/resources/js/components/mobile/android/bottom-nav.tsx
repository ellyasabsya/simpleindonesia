import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NavItem, NavViewProps } from '../nav-types';
import { currentPath, isActive } from '../nav-utils';
import { useTyping } from '../use-typing';

// Gaya Android (Material 3) + Premium Elegant: bar krem, "pil" emas lembut di belakang menu aktif.
// Tombol Beranda berupa FAB persegi membulat berwarna emas.

const ITEM =
    'group flex h-[72px] min-w-0 flex-1 touch-manipulation flex-col items-center justify-start gap-1 pt-2.5 select-none';

function Pill({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <span
            className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors ${
                active
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-400/25 dark:text-indigo-100'
                    : 'text-slate-600 group-active:bg-slate-900/5 dark:text-slate-300 dark:group-active:bg-white/10'
            }`}
        >
            {children}
        </span>
    );
}

const labelCls = (active: boolean) =>
    `text-xs leading-4 ${
        active ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'
    }`;

function Tab({ item, path }: { item: NavItem; path: string }) {
    const active = isActive(path, item);
    const Icon = item.icon;
    const inner = (
        <>
            <Pill active={active}>
                <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.7} />
            </Pill>
            <span className={labelCls(active)}>{item.label}</span>
        </>
    );

    return item.reload ? (
        <a href={item.href} className={ITEM} aria-current={active ? 'page' : undefined}>
            {inner}
        </a>
    ) : (
        <Link href={item.href} className={ITEM} aria-current={active ? 'page' : undefined}>
            {inner}
        </Link>
    );
}

export default function AndroidBottomNav({ home, left, right, onMenu }: NavViewProps) {
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
            <div className="relative bg-[#f4f6fc]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-[#0a0c1a]/95 dark:shadow-[0_-1px_0_rgba(255,255,255,0.08)]">
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
                        className="group relative block h-[72px] touch-manipulation select-none"
                    >
                        <span
                            className="absolute -top-[22px] left-1/2 flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-[18px] text-white ring-[5px] ring-[#f4f6fc] transition-transform duration-150 group-active:scale-95 dark:ring-[#0a0c1a]"
                            style={{
                                backgroundImage: 'linear-gradient(145deg, #818cf8 0%, #4f46e5 55%, #3730a3 100%)',
                                boxShadow: '0 8px 18px rgba(79,70,229,0.38), inset 0 1px 0 rgba(255,255,255,0.45)',
                            }}
                        >
                            <HomeGlyph className="h-7 w-7" strokeWidth={2.2} />
                        </span>
                        <span className={`absolute inset-x-0 bottom-2.5 text-center ${labelCls(homeActive)}`}>{home.label}</span>
                    </Link>

                    <div className="flex min-w-0">
                        {right.map((item) => (
                            <Tab key={item.href} item={item} path={path} />
                        ))}
                        {onMenu && (
                            <button type="button" onClick={onMenu} className={ITEM}>
                                <Pill active={false}>
                                    <Menu className="h-6 w-6" strokeWidth={1.7} />
                                </Pill>
                                <span className={labelCls(false)}>Menu</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
