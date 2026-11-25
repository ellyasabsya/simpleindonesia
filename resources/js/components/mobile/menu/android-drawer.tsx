import { Link } from '@inertiajs/react';
import { House, LogOut, Moon, Sun } from 'lucide-react';
import ItemLink from './item-link';
import type { MenuPanelProps } from './menu-types';
import { badgeText } from './menu-utils';

const itemCls = 'flex h-14 items-center gap-3 rounded-full px-4 text-sm font-medium';

/** Menu gaya Material 3: navigation drawer dari kiri, menu aktif ditandai pil. */
export default function AndroidDrawer({ open, onClose, groups, user, dark, toggleTheme, onLogout }: MenuPanelProps) {
    return (
        <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/32 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />
            <aside
                role="dialog"
                aria-label="Menu"
                style={{
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                    transitionProperty: 'transform, visibility',
                    transitionDuration: '0.3s',
                    transitionDelay: open ? '0s' : '0s, 0.3s',
                    visibility: open ? 'visible' : 'hidden',
                }}
                className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col rounded-r-[28px] bg-[#ffffff] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-[#0f172a] dark:bg-[#1e293b] dark:text-[#f8fafc]"
            >
                <div className="flex items-center gap-3 px-7 pt-6 pb-4">
                    <img src="/logo-s-sm.png" alt="SIMPLE" className="size-11 shrink-0 object-contain" />
                    <div className="min-w-0">
                        <p className="truncate text-base font-medium">{user.name ?? 'Akun'}</p>
                        {user.subtitle && <p className="truncate text-xs text-[#475569] dark:text-[#cbd5e1]">{user.subtitle}</p>}
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
                    {groups.map((g) => (
                        <section key={g.title}>
                            {g.title && <p className="px-4 pt-3 pb-1 text-sm font-medium text-slate-600 dark:text-slate-300">{g.title}</p>}
                            {g.items.map((item) => (
                                <ItemLink
                                    key={item.href}
                                    item={item}
                                    onClick={onClose}
                                    className={`${itemCls} ${item.active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'active:bg-black/10 dark:active:bg-white/10'}`}
                                >
                                    <item.Icon className="size-6 shrink-0" />
                                    <span className="flex-1 truncate">{item.label}</span>
                                    {item.badge && (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${item.badge.tone === 'red' ? 'bg-[#b3261e]' : 'bg-[#b45309]'}`}>
                                            {badgeText(item.badge.count)}
                                        </span>
                                    )}
                                </ItemLink>
                            ))}
                        </section>
                    ))}
                </nav>

                <div className="mx-3 space-y-1 border-t border-[#cbd5e1] py-2 dark:border-[#475569]">
                    <button type="button" onClick={toggleTheme} className={`${itemCls} w-full active:bg-black/10 dark:active:bg-white/10`}>
                        {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
                        <span className="flex-1 text-left">{dark ? 'Mode terang' : 'Mode gelap'}</span>
                    </button>
                    <Link href="/?publik=1" onClick={onClose} className={`${itemCls} active:bg-black/10 dark:active:bg-white/10`}>
                        <House className="size-6" />
                        <span className="flex-1">Halaman Utama</span>
                    </Link>
                    <button type="button" onClick={onLogout} className={`${itemCls} w-full text-[#b3261e] active:bg-black/10 dark:text-[#f2b8b5] dark:active:bg-white/10`}>
                        <LogOut className="size-6" />
                        <span className="flex-1 text-left">Keluar</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
