import { usePage } from '@inertiajs/react';
import {
    Award,
    Building2,
    CalendarDays,
    Newspaper,
    Ticket,
    Vote,
    Wallet,
} from 'lucide-react';
import { HomeIcon } from './home-icon';
import type { NavConfig, NavItem, NavVariant } from './nav-types';

// ============================================================
// DAFTAR MENU BOTTOM NAV. Ubah di sini saja: berlaku untuk iOS
// dan Android sekaligus. Tombol bulat di tengah = `home`.
// ============================================================

const PUBLIC: NavConfig = {
    home: { label: 'Beranda', href: '/', icon: HomeIcon, exact: true },
    left: [
        { label: 'Event', href: '/events', icon: CalendarDays },
        { label: 'Tiket', href: '/tickets', icon: Ticket },
    ],
    right: [
        { label: 'Voting', href: '/voting', icon: Vote },
        { label: 'Berita', href: '/berita', icon: Newspaper },
    ],
};

const USER_HOME: NavItem = {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
};
const USER_LEFT: NavItem[] = [
    { label: 'Event', href: '/events', icon: CalendarDays },
    { label: 'Tiket', href: '/tiket', icon: Ticket },
];
const USER_RIGHT: NavItem[] = [
    { label: 'Sertifikat', href: '/sertifikat-saya', icon: Award, reload: true },
];

const PANEL_HOME: NavItem = {
    label: 'Ringkasan',
    href: '/panel',
    icon: HomeIcon,
    exact: true,
};
const PANEL_LEFT: NavItem[] = [
    {
        label: 'Event',
        href: '/panel/event',
        icon: CalendarDays,
        need: ['events', 'checkin'],
    },
    {
        label: 'Pendapatan',
        href: '/panel/pendapatan',
        icon: Wallet,
        need: ['finance', 'withdraw'],
    },
];

export function useNavConfig(variant: NavVariant, hasPanel?: boolean): NavConfig {
    const shared = usePage<{
        panelPerms?: string[] | null;
        panelOwner?: boolean;
    }>().props;

    if (variant === 'public') {
        return PUBLIC;
    }

    if (variant === 'user') {
        const last: NavItem = hasPanel
            ? { label: 'Panel', href: '/panel', icon: Building2 }
            : { label: 'Lembaga', href: '/lembaga/daftar', icon: Building2 };

        return {
            home: USER_HOME,
            left: USER_LEFT,
            right: [...USER_RIGHT, last],
        };
    }

    // Panel: menu disaring sesuai izin; tombol "Menu" ditambahkan oleh tampilan.
    const perms = shared.panelPerms ?? null;
    const owner = Boolean(shared.panelOwner);

    return {
        home: PANEL_HOME,
        left: PANEL_LEFT.filter(
            (i) =>
                owner ||
                perms === null ||
                !i.need ||
                i.need.some((p) => perms.includes(p)),
        ),
        right: [],
    };
}
