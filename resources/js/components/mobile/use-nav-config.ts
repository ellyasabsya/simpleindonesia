import { usePage } from '@inertiajs/react';
import { HomeIcon } from './home-icon';
import {
    AwardIcon,
    BuildingIcon,
    CalendarIcon,
    PersonIcon,
    TicketIcon,
    VoteIcon,
    WalletIcon,
} from './nav-icons';
import type { NavConfig, NavItem, NavVariant } from './nav-types';

// ============================================================
// DAFTAR MENU BOTTOM NAV. Ubah di sini saja: berlaku untuk iOS
// dan Android sekaligus. Tombol bulat di tengah = `home`.
// ============================================================

const PUBLIC: NavConfig = {
    home: { label: 'Beranda', href: '/', icon: HomeIcon, exact: true },
    left: [
        { label: 'Event', href: '/events', icon: CalendarIcon },
        { label: 'Tiket', href: '/tickets', icon: TicketIcon },
    ],
    right: [
        { label: 'Voting', href: '/voting', icon: VoteIcon },
        { label: 'Saya', href: '/login', icon: PersonIcon },
    ],
};

const USER_HOME: NavItem = {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
};
const USER_LEFT: NavItem[] = [
    { label: 'Event', href: '/events', icon: CalendarIcon },
    { label: 'Tiket', href: '/tickets', icon: TicketIcon },
];
const USER_RIGHT: NavItem[] = [
    { label: 'Sertifikat', href: '/sertifikat-saya', icon: AwardIcon, reload: true },
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
        icon: CalendarIcon,
        need: ['events', 'checkin'],
    },
    {
        label: 'Pendapatan',
        href: '/panel/pendapatan',
        icon: WalletIcon,
        need: ['finance', 'withdraw'],
    },
];

export function useNavConfig(variant: NavVariant, hasPanel?: boolean): NavConfig {
    const page = usePage<{
        panelPerms?: string[] | null;
        panelOwner?: boolean;
        auth?: { user?: unknown } | null;
    }>();
    const shared = page.props;
    const publicView = /[?&]publik=1(&|$)/.test(page.url);

    if (variant === 'public') {
        const base: NavConfig = publicView ? { ...PUBLIC, home: { ...PUBLIC.home, href: '/?publik=1' } } : PUBLIC;
        // "Saya": tamu ke halaman masuk, yang sudah login ke halaman akun.
        if (!shared.auth?.user) {
            return base;
        }

        return {
            ...base,
            right: base.right.map((i) =>
                i.label === 'Saya' ? { ...i, href: '/profil/edit' } : i,
            ),
        };
    }

    if (variant === 'user') {
        const last: NavItem = hasPanel
            ? { label: 'Panel', href: '/panel', icon: BuildingIcon }
            : { label: 'Lembaga', href: '/lembaga/daftar', icon: BuildingIcon };

        return {
            home: USER_HOME,
            left: USER_LEFT,
            right: [...USER_RIGHT, last],
        };
    }

    // Panel: menu disaring sesuai izin; tombol "Menu" ditambahkan oleh tampilan.
    const perms = shared.panelPerms ?? null;
    const owner = Boolean(shared.panelOwner);

    const items = PANEL_LEFT.filter(
        (i) => owner || perms === null || !i.need || i.need.some((p) => perms.includes(p)),
    );
    const half = Math.ceil(items.length / 2);

    return {
        home: PANEL_HOME,
        left: items.slice(0, half),
        right: items.slice(half),
    };
}
