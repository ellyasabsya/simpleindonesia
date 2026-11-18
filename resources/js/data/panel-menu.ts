import {
    Building2,
    CalendarDays,
    CirclePlus,
    LayoutDashboard,
    Star,
    Ticket,
    Users,
    Vote,
    Wallet,
    type LucideIcon,
} from 'lucide-react';

export type PanelMenuItem = { label: string; href: string; icon: LucideIcon };
export type PanelMenuGroup = { title: string; items: PanelMenuItem[] };

export const panelMenu: PanelMenuGroup[] = [
    { title: 'Utama', items: [{ label: 'Dashboard', href: '/panel', icon: LayoutDashboard }] },
    {
        title: 'Event',
        items: [
            { label: 'Event Lembaga', href: '/panel', icon: CalendarDays },
            { label: 'Ajukan Event', href: '/panel/ajukan', icon: CirclePlus },
            { label: 'Peserta', href: '/panel/peserta', icon: Users },
        ],
    },
    {
        title: 'Aktivitas',
        items: [
            { label: 'Tiket & Penjualan', href: '/panel/tiket', icon: Ticket },
            { label: 'Voting', href: '/panel/voting', icon: Vote },
            { label: 'Penilaian', href: '/panel/penilaian', icon: Star },
        ],
    },
    {
        title: 'Lembaga',
        items: [
            { label: 'Pendapatan', href: '/panel/pendapatan', icon: Wallet },
            { label: 'Profil Lembaga', href: '/panel/profil', icon: Building2 },
        ],
    },
];
