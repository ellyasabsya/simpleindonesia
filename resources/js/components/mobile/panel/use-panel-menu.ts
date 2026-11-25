import { usePage } from '@inertiajs/react';
import { ArrowLeft, Layers } from 'lucide-react';
import { eventMenuIcons } from '@/data/event-menu-icons';
import { groupEventItems } from '@/data/event-menu-groups';
import { panelMenu } from '@/data/panel-menu';
import type { MenuGroup, MenuIcon } from '../menu/menu-types';

type EventNav = {
    title: string;
    items: { key: string; label: string; href: string }[];
    parent?: { title: string; href: string };
    subs?: { label: string; href: string }[];
};
type PanelProps = { eventNav?: EventNav; panelPerms?: string[] | null; panelOwner?: boolean };
type RawGroup = { title: string; items: { label: string; href: string; icon: MenuIcon }[] };

// Sama dengan MENU_NEED di sidebar desktop: izin yang dibutuhkan tiap menu.
const MENU_NEED: Record<string, string[]> = {
    '/panel/event': ['events', 'checkin'],
    '/panel/ajukan': ['events'],
    '/panel/peserta': ['events', 'checkin'],
    '/panel/tiket': ['events', 'checkin', 'finance'],
    '/panel/voting': ['events'],
    '/panel/penilaian': ['events'],
    '/panel/pendapatan': ['finance', 'withdraw'],
};

/** Menu panel lembaga untuk HP, dengan aturan izin dan mode event yang sama seperti sidebar desktop. */
export function usePanelMenu(): { groups: MenuGroup[]; parent?: { title: string; href: string } } {
    const page = usePage<PanelProps>();
    const path = page.url.split('?')[0];
    const { eventNav, panelPerms, panelOwner } = page.props;
    const perms = panelPerms ?? null;
    const owner = Boolean(panelOwner);

    const visible = (href: string) => {
        if (owner || perms === null) return true;
        if (href === '/panel/profil') return false;
        const need = MENU_NEED[href];
        return !need || need.some((p) => perms.includes(p));
    };

    const raw: RawGroup[] = eventNav
        ? [
              ...groupEventItems(eventNav.title, eventNav.items
                      .filter((i) => !(eventNav.parent && (i.href.endsWith('/kalender') || i.href.endsWith('/registrasi'))))
                      .map((i) => ({ label: i.label, href: i.href, icon: eventMenuIcons[i.key] ?? eventMenuIcons.dashboard }))),
              ...(eventNav.subs?.length
                  ? [{ title: 'Sub-event', items: eventNav.subs.map((s) => ({ label: s.label, href: s.href, icon: Layers })) }]
                  : []),
          ]
        : panelMenu;

    const groups: MenuGroup[] = raw
        .map((g) => ({
            title: g.title,
            items: g.items
                .filter((it) => visible(it.href))
                .map((it) => ({
                    label: it.label,
                    href: it.href,
                    Icon: it.icon,
                    active: it.href === '/panel' || eventNav ? path === it.href : path.startsWith(it.href),
                    badge: null,
                })),
        }))
        .filter((g) => g.items.length > 0);

    if (eventNav?.parent) {
        groups.unshift({
            title: '',
            items: [{ label: eventNav.parent.title, href: eventNav.parent.href, Icon: ArrowLeft, active: false, badge: null }],
        });
    }

    return { groups, parent: eventNav?.parent };
}
