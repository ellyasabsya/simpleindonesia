import { Link } from '@inertiajs/react';
import { ChevronRight, House, LogOut, Moon, Sun } from 'lucide-react';
import { CARD, FIELD, MUTED, PAGE } from '../kit/soft';
import ItemLink from './item-link';
import type { MenuPanelProps } from './menu-types';
import { badgeText } from './menu-utils';

function Switch({ on }: { on: boolean }) {
    return (
        <span className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${on ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </span>
    );
}

const group = 'overflow-hidden rounded-3xl divide-y divide-slate-900/[0.07] dark:divide-white/10 ' + CARD;
const row = 'flex min-h-12 w-full items-center gap-3.5 px-4 py-2.5 text-left text-[15px] font-medium active:bg-slate-900/[0.04] dark:active:bg-white/10';
const tile = 'flex size-9 shrink-0 items-center justify-center rounded-xl ';

/** Menu satu gaya (iOS dan Android): sheet bawah dengan kartu bergaris tipis, sama dengan sheet notifikasi. */
export default function MenuSheet({ open, onClose, groups, user, dark, toggleTheme, onLogout }: MenuPanelProps) {
    return (
        <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div onClick={onClose} className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
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
                className={'absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[32px] text-slate-900 shadow-2xl dark:text-white ' + PAGE}
            >
                <div className="flex justify-center pt-3">
                    <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                </div>
                <div className="px-5 pt-3 pb-3">
                    <p className="truncate text-[17px] font-semibold tracking-tight">{user.name ?? 'Akun'}</p>
                    {user.subtitle && <p className={'truncate text-[13px] ' + MUTED}>{user.subtitle}</p>}
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                    {groups.map((g) => (
                        <section key={g.title}>
                            {g.title && <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{g.title}</p>}
                            <div className={group}>
                                {g.items.map((item) => (
                                    <ItemLink key={item.href} item={item} onClick={onClose} className={row}>
                                        <span className={tile + (item.active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' text-indigo-700 dark:text-indigo-300')}>
                                            <item.Icon className="size-5" />
                                        </span>
                                        <span className={'flex-1 truncate ' + (item.active ? 'text-indigo-700 dark:text-indigo-300' : '')}>{item.label}</span>
                                        {item.badge && (
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${item.badge.tone === 'red' ? 'bg-rose-600' : 'bg-amber-600'}`}>
                                                {badgeText(item.badge.count)}
                                            </span>
                                        )}
                                        <ChevronRight className={'size-4 shrink-0 ' + MUTED} />
                                    </ItemLink>
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className={group}>
                        <button type="button" onClick={toggleTheme} className={row}>
                            <span className={tile + FIELD + ' text-indigo-700 dark:text-indigo-300'}>
                                {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                            </span>
                            <span className="flex-1">Mode gelap</span>
                            <Switch on={dark} />
                        </button>
                        <Link href="/?publik=1" onClick={onClose} className={row}>
                            <span className={tile + FIELD + ' text-indigo-700 dark:text-indigo-300'}>
                                <House className="size-5" />
                            </span>
                            <span className="flex-1">Halaman Utama</span>
                            <ChevronRight className={'size-4 shrink-0 ' + MUTED} />
                        </Link>
                        <button type="button" onClick={onLogout} className={row + ' text-rose-600 dark:text-rose-400'}>
                            <span className={tile + FIELD}>
                                <LogOut className="size-5" />
                            </span>
                            <span className="flex-1">Keluar</span>
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
