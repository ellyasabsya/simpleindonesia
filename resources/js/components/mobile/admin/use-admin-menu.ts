import { usePage } from '@inertiajs/react';
import { adminMenu } from '@/data/admin-menu';

type Counts = {
    pending_lembaga?: number;
    pending_comments?: number;
    pending_review?: number;
    pending_tiket?: number;
    pending_paket?: number;
    pending_penarikan?: number;
};

type Source = (typeof adminMenu)[number]['items'][number];

export type MenuBadge = { count: number; tone: 'red' | 'amber' };
export type MenuItem = {
    label: string;
    href: string;
    Icon: Source['icon'];
    active: boolean;
    badge: MenuBadge | null;
};
export type MenuGroup = { title: string; items: MenuItem[] };

/** Menu admin + penanda aktif + angka lencana, dihitung dari data yang sama dengan sidebar desktop. */
export function useAdminMenu(): MenuGroup[] {
    const page = usePage<Counts>();
    const path = page.url.split('?')[0];
    const p = page.props;

    const red: Record<string, number> = {
        '/admin/review': p.pending_review ?? 0,
        '/admin/pesanan-tiket': p.pending_tiket ?? 0,
        '/admin/verifikasi-paket': p.pending_paket ?? 0,
        '/admin/pendapatan': p.pending_penarikan ?? 0,
    };
    const amber: Record<string, number> = {
        '/admin/lembaga': p.pending_lembaga ?? 0,
        '/admin/komentar': p.pending_comments ?? 0,
    };

    return adminMenu.map((group) => ({
        title: group.title,
        items: group.items.map(({ label, href, icon }) => {
            const badge: MenuBadge | null =
                (red[href] ?? 0) > 0
                    ? { count: red[href], tone: 'red' }
                    : (amber[href] ?? 0) > 0
                      ? { count: amber[href], tone: 'amber' }
                      : null;
            return {
                label,
                href,
                Icon: icon,
                active: href === '/admin' ? path === '/admin' : path.startsWith(href),
                badge,
            };
        }),
    }));
}

export const badgeText = (n: number) => (n > 99 ? '99+' : String(n));
