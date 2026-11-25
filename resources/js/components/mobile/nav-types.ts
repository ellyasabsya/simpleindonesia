import type { ComponentType } from 'react';

export type NavIcon = ComponentType<{ className?: string; strokeWidth?: number; active?: boolean }>;

export type NavItem = {
    label: string;
    href: string;
    icon: NavIcon;
    /** true = hanya aktif kalau alamatnya persis sama (bukan turunannya) */
    exact?: boolean;
    /** true = pakai <a> biasa (muat ulang penuh), untuk halaman non-Inertia */
    reload?: boolean;
    /** izin panel yang dibutuhkan; salah satu cukup */
    need?: string[];
};

export type NavVariant = 'public' | 'user' | 'panel';

/** Props yang dipakai layout (tidak berubah, jadi layout tidak perlu diedit). */
export type NavProps = {
    variant: NavVariant;
    hasPanel?: boolean;
    onMenu?: () => void;
};

/** Susunan bar: tombol Beranda di tengah, menu lain di kiri dan kanan. */
export type NavConfig = {
    home: NavItem;
    left: NavItem[];
    right: NavItem[];
};

/** Props yang diterima tampilan iOS dan Android. */
export type NavViewProps = NavConfig & { onMenu?: () => void };
