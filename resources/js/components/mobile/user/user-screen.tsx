import { Head, router, usePage } from '@inertiajs/react';
import { Award, Building2, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';
import Avatar from '@/components/user/avatar';
import NotificationBell from '@/components/user/notification-bell';
import { Toast } from '@/lib/toast';
import AppBar from '../app-bar';
import AppBarButton from '../app-bar-button';
import MobileBottomNav from '../bottom-nav';
import MenuPanel from '../menu/menu-panel';
import type { MenuGroup } from '../menu/menu-types';
import { useMenuState } from '../menu/use-menu-state';
import Screen from '../screen';

type Props = {
    title: string;
    name: string;
    email?: string;
    avatar: string | null;
    panel: boolean;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};

/** Layout peserta khusus HP: app bar + bell + menu akun, dengan bottom nav yang sudah ada. */
export default function UserScreen({ title, name, email, avatar, panel, dark, toggleTheme, children }: Props) {
    const path = usePage().url.split('?')[0];
    const menu = useMenuState();

    const groups: MenuGroup[] = [
        {
            title: 'Akun',
            items: [
                { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard, active: path === '/dashboard', badge: null },
                { label: 'Sertifikat Saya', href: '/sertifikat-saya', Icon: Award, active: false, badge: null, external: true },
                {
                    label: panel ? 'Panel Lembaga' : 'Daftarkan Lembaga',
                    href: panel ? '/panel' : '/lembaga/daftar',
                    Icon: Building2,
                    active: false,
                    badge: null,
                },
            ],
        },
    ];

    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <Toast />
            <Screen
                bottomNav
                bar={
                    <AppBar
                        title={title}
                        actions={
                            <>
                                <NotificationBell />
                                <AppBarButton onClick={menu.show} label="Menu akun">
                                    <Avatar name={name} src={avatar} className="h-8 w-8 rounded-full text-sm" />
                                </AppBarButton>
                            </>
                        }
                    />
                }
            >
                {children}
            </Screen>
            <MobileBottomNav variant="user" hasPanel={panel} />
            <MenuPanel
                open={menu.open}
                onClose={menu.hide}
                groups={groups}
                user={{ name, subtitle: email }}
                dark={dark}
                toggleTheme={toggleTheme}
                onLogout={() => router.post('/logout')}
            />
        </>
    );
}

