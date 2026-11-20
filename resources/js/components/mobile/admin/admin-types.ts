import type { MenuGroup } from './use-admin-menu';

export type AdminUser = { name?: string; role?: string } | undefined;

export type MenuPanelProps = {
    open: boolean;
    onClose: () => void;
    groups: MenuGroup[];
    user: AdminUser;
    dark: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
};
