import { Link } from '@inertiajs/react';
import { House, LogOut, Moon, Sun } from 'lucide-react';
import type { MenuPanelProps } from './admin-types';
import { badgeText } from './use-admin-menu';

const item = 'flex h-14 items-center gap-3 rounded-full px-4 text-sm font-medium';

/** Menu admin gaya Material 3: navigation drawer dari kiri, menu aktif ditandai pil. */
export default function AndroidDrawer({ open, onClose, groups, user, dark, toggleTheme, onLogout }: MenuPanelProps) {
    return (
        <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/32 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />
            <aside
                role="dialog"
                aria-label="Menu admin"
                style={{
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                    transitionProperty: 'transform, visibility',
                    transitionDuration: '0.3s',
                    transitionDelay: open ? '0s' : '0s, 0.3s',
                    visibility: open ? 'visible' : 'hidden',
                }}
                className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col rounded-r-[28px] bg-[#f3edf7] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-[#1d1b20] dark:bg-[#211f26] dark:text-[#e6e0e9]"
            >
                <div className="flex items-center gap-3 px-7 pt-6 pb-4">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xl font-black text-white">S</span>
                    <div className="min-w-0">
                        <p className="truncate text-base font-medium">{user?.name ?? 'Admin'}</p>
                        <p className="text-xs text-[#49454f] uppercase dark:text-[#cac4d0]">{user?.role ?? 'admin'} · SIMPLE</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
                    {groups.map((g) => (
                        <section key={g.title}>
                            <p className="px-4 pt-3 pb-1 text-sm font-medium text-[#49454f] dark:text-[#cac4d0]">{g.title}</p>
                            {g.items.map(({ label, href, Icon, active, badge }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={onClose}
                                    className={`${item} ${active ? 'bg-[#e8def8] text-[#1d192b] dark:bg-[#4a4458] dark:text-[#e8def8]' : 'active:bg-black/10 dark:active:bg-white/10'}`}
                                >
                                    <Icon className="size-6 shrink-0" />
                                    <span className="flex-1 truncate">{label}</span>
                                    {badge && (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${badge.tone === 'red' ? 'bg-[#b3261e]' : 'bg-[#b45309]'}`}>
                                            {badgeText(badge.count)}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </section>
                    ))}
                </nav>

                <div className="mx-3 space-y-1 border-t border-[#cac4d0] py-2 dark:border-[#49454f]">
                    <button type="button" onClick={toggleTheme} className={`${item} w-full active:bg-black/10 dark:active:bg-white/10`}>
                        {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
                        <span className="flex-1 text-left">{dark ? 'Mode terang' : 'Mode gelap'}</span>
                    </button>
                    <Link href="/" onClick={onClose} className={`${item} active:bg-black/10 dark:active:bg-white/10`}>
                        <House className="size-6" />
                        <span className="flex-1">Halaman Utama</span>
                    </Link>
                    <button type="button" onClick={onLogout} className={`${item} w-full text-[#b3261e] active:bg-black/10 dark:text-[#f2b8b5] dark:active:bg-white/10`}>
                        <LogOut className="size-6" />
                        <span className="flex-1 text-left">Keluar</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
