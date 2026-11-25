import type { ComponentType } from 'react';

export type MenuIcon = ComponentType<{ className?: string }>;
export type MenuBadge = { count: number; tone: 'red' | 'amber' };

export type MenuItem = {
    label: string;
    href: string;
    Icon: MenuIcon;
    active: boolean;
    badge: MenuBadge | null;
    /** true = tautan biasa (muat ulang halaman), bukan navigasi Inertia. */
    external?: boolean;
};
export type MenuGroup = { title: string; items: MenuItem[] };
export type MenuUser = { name?: string; subtitle?: string };

export type MenuPanelProps = {
    open: boolean;
    onClose: () => void;
    groups: MenuGroup[];
    user: MenuUser;
    dark: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
    /** true = sembunyikan tautan Halaman Utama (dipakai menu admin). */
    hideHome?: boolean;
};
