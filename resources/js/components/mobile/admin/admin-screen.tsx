import { Head, router } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import NotificationBell from '@/components/admin/notification-bell';
import { Toast } from '@/lib/toast';
import type { NotificationsProp } from '@/types';
import AppBar from '../app-bar';
import { usePlatform } from '../use-platform';
import type { AdminUser } from './admin-types';
import AndroidDrawer from './android-drawer';
import IosMenuSheet from './ios-menu-sheet';
import { useAdminMenu } from './use-admin-menu';

type Props = {
    title: string;
    user: AdminUser;
    notifications: NotificationsProp | null;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};

/** Layout admin khusus HP: app bar native + menu (lembar iOS / drawer Android). Desktop tidak memakai ini. */
export default function AdminScreen({ title, user, notifications, dark, toggleTheme, children }: Props) {
    const ios = usePlatform() === 'ios';
    const groups = useAdminMenu();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    const menuButton = (
        <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className={
                ios
                    ? 'flex h-11 w-11 items-center justify-center text-[#007AFF] active:opacity-40 dark:text-[#0A84FF]'
                    : 'flex size-12 items-center justify-center rounded-full text-[#1d1b20] active:bg-black/10 dark:text-[#e6e0e9] dark:active:bg-white/15'
            }
        >
            <Menu className={ios ? 'size-[22px]' : 'size-6'} />
        </button>
    );

    const panel = {
        open,
        onClose: () => setOpen(false),
        groups,
        user,
        dark,
        toggleTheme,
        onLogout: () => router.post('/logout'),
    };

    return (
        <>
            <Head title={`${title} - Admin SIMPLE`} />
            <Toast />
            <div
                data-mobile-admin={ios ? 'ios' : 'android'}
                className={`min-h-dvh text-slate-900 dark:text-white ${ios ? 'bg-[#f2f2f7] dark:bg-black' : 'bg-[#fef7ff] dark:bg-[#141218]'}`}
            >
                <AppBar
                    title={title}
                    leading={menuButton}
                    actions={<NotificationBell notifications={notifications} />}
                />
                <main className="space-y-4 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{children}</main>
            </div>
            {ios ? <IosMenuSheet {...panel} /> : <AndroidDrawer {...panel} />}
        </>
    );
}
