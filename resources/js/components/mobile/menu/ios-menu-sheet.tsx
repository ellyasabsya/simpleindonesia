import { ChevronRight, House, LogOut } from 'lucide-react';
import { Link } from '@inertiajs/react';
import ItemLink from './item-link';
import type { MenuPanelProps } from './menu-types';
import { badgeText } from './menu-utils';

function Switch({ on }: { on: boolean }) {
    return (
        <span className={`relative h-[31px] w-[51px] rounded-full transition-colors ${on ? 'bg-[#34C759]' : 'bg-black/15 dark:bg-white/20'}`}>
            <span className={`absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </span>
    );
}

const group = 'overflow-hidden rounded-xl bg-white dark:bg-[#1c1c1e]';
const row = 'flex min-h-11 items-center gap-3 px-4 py-2.5 text-[17px] active:bg-black/5 dark:active:bg-white/10';

/** Menu gaya iOS: lembar yang naik dari bawah, daftar dikelompokkan dengan pemisah tipis. */
export default function IosMenuSheet({ open, onClose, groups, user, dark, toggleTheme, onLogout }: MenuPanelProps) {
    return (
        <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                role="dialog"
                aria-label="Menu"
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transitionProperty: 'transform, visibility',
                    transitionDuration: '0.3s',
                    transitionDelay: open ? '0s' : '0s, 0.3s',
                    visibility: open ? 'visible' : 'hidden',
                }}
                className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[22px] bg-[#f2f2f7] shadow-2xl dark:bg-black"
            >
                <div className="flex justify-center pt-2 pb-1">
                    <span className="h-[5px] w-9 rounded-full bg-black/20 dark:bg-white/25" />
                </div>
                <div className="px-4 pt-1 pb-3">
                    <p className="truncate text-[22px] font-bold text-black dark:text-white">{user.name ?? 'Akun'}</p>
                    {user.subtitle && <p className="truncate text-[13px] text-black/50 uppercase dark:text-white/50">{user.subtitle}</p>}
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-black dark:text-white">
                    {groups.map((g) => (
                        <section key={g.title}>
                            {g.title && <p className="mb-1.5 px-4 text-[13px] text-black/50 uppercase dark:text-white/50">{g.title}</p>}
                            <div className={`${group} divide-y divide-black/10 dark:divide-white/10`}>
                                {g.items.map((item) => (
                                    <ItemLink
                                        key={item.href}
                                        item={item}
                                        onClick={onClose}
                                        className={`${row} ${item.active ? 'font-semibold text-indigo-600 dark:text-indigo-300' : ''}`}
                                    >
                                        <item.Icon className="size-5 shrink-0" />
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {item.badge && (
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${item.badge.tone === 'red' ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'}`}>
                                                {badgeText(item.badge.count)}
                                            </span>
                                        )}
                                        <ChevronRight className="size-4 shrink-0 text-black/25 dark:text-white/30" />
                                    </ItemLink>
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className={`${group} divide-y divide-black/10 dark:divide-white/10`}>
                        <button type="button" onClick={toggleTheme} className={`${row} w-full`}>
                            <span className="flex-1 text-left">Mode gelap</span>
                            <Switch on={dark} />
                        </button>
                        <Link href="/" onClick={onClose} className={row}>
                            <House className="size-5" />
                            <span className="flex-1">Halaman Utama</span>
                        </Link>
                        <button type="button" onClick={onLogout} className={`${row} w-full text-[#FF3B30]`}>
                            <LogOut className="size-5" />
                            <span className="flex-1 text-left">Keluar</span>
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
