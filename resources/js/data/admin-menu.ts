import {
    ArrowLeftRight,
    Building2,
    CalendarDays,
    ClipboardCheck,
    CreditCard,
    LayoutDashboard,
    MessageSquare,
    Package,
    Settings,
    Star,
    Ticket,
    Wallet,
    type LucideIcon, Newspaper } from 'lucide-react';

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
        title: 'Konten',
        items: [
            { label: 'Berita', href: '/admin/berita', icon: Newspaper },
            { label: 'Komentar', href: '/admin/komentar', icon: MessageSquare },
        ],
    },
    {
        title: 'Transaksi',
        items: [
            { label: 'Pendapatan', href: '/admin/pendapatan', icon: Wallet },
            { label: 'Transaksi', href: '/admin/transaksi', icon: ArrowLeftRight },
            { label: 'Verifikasi Tiket', href: '/admin/pesanan-tiket', icon: Ticket },
            { label: 'Verifikasi Paket', href: '/admin/verifikasi-paket', icon: CreditCard },
        ],
    },
    {
        title: 'Lembaga & Paket',
        items: [
            { label: 'Lembaga', href: '/admin/lembaga', icon: Building2 },
            { label: 'Manajemen Paket', href: '/admin/paket', icon: Package },
        ],
    },
    {
        title: 'Sistem',
        items: [{ label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings }],
    },
];
