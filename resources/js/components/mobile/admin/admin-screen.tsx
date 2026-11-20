import { Head, router } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import NotificationBell from '@/components/admin/notification-bell';
import { Toast } from '@/lib/toast';
import type { NotificationsProp } from '@/types';
import AppBar from '../app-bar';
import AppBarButton from '../app-bar-button';
import MenuPanel from '../menu/menu-panel';
import { useMenuState } from '../menu/use-menu-state';
import Screen from '../screen';
import { useAdminMenu } from './use-admin-menu';

type Props = {
    title: string;
    user: { name?: string; role?: string } | undefined;
    notifications: NotificationsProp | null;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};

/** Layout admin khusus HP: app bar native + menu (lembar iOS / drawer Android). Desktop tidak memakai ini. */
export default function AdminScreen({ title, user, notifications, dark, toggleTheme, children }: Props) {
    const groups = useAdminMenu();
    const menu = useMenuState();

    return (
        <>
            <Head title={`${title} - Admin SIMPLE`} />
            <Toast />
            <Screen
                bar={
                    <AppBar
                        title={title}
                        leading={
                            <AppBarButton onClick={menu.show} label="Buka menu">
                                <Menu />
                            </AppBarButton>
                        }
                        actions={<NotificationBell notifications={notifications} />}
                    />
                }
            >
                {children}
            </Screen>
            <MenuPanel
                open={menu.open}
                onClose={menu.hide}
                groups={groups}
                user={{ name: user?.name ?? 'Admin', subtitle: `${user?.role ?? 'admin'} · SIMPLE` }}
                dark={dark}
                toggleTheme={toggleTheme}
                onLogout={() => router.post('/logout')}
            />
        </>
    );
}
