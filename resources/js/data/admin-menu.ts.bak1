import {
    ArrowLeftRight,
    Building2,
    CalendarDays,
    ClipboardCheck,
    CreditCard,
    LayoutDashboard,
    Package,
    Star,
    Ticket,
    Wallet,
    type LucideIcon,
} from 'lucide-react';

export type AdminMenuItem = { label: string; href: string; icon: LucideIcon };
export type AdminMenuGroup = { title: string; items: AdminMenuItem[] };

export const adminMenu: AdminMenuGroup[] = [
    {
        title: 'Utama',
        items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
        title: 'Event',
        items: [
            { label: 'Manajemen Event', href: '/admin/events', icon: CalendarDays },
            { label: 'Review Event', href: '/admin/review', icon: ClipboardCheck },
            { label: 'Sistem Penilaian', href: '/admin/penilaian', icon: Star },
        ],
    },
    {
        title: 'Transaksi',
        items: [
            { label: 'Verifikasi Tiket', href: '/admin/tiket', icon: Ticket },
            { label: 'Verifikasi Paket', href: '/admin/verifikasi-paket', icon: CreditCard },
            { label: 'Pendapatan', href: '/admin/pendapatan', icon: Wallet },
            { label: 'Transaksi', href: '/admin/transaksi', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'Lembaga & Paket',
        items: [
            { label: 'Lembaga', href: '/admin/lembaga', icon: Building2 },
            { label: 'Manajemen Paket', href: '/admin/paket', icon: Package },
        ],
    },
];
