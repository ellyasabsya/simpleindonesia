import { Head, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toast } from '@/lib/toast';
import AppBar from '../app-bar';
import MobileBottomNav from '../bottom-nav';
import MenuPanel from '../menu/menu-panel';
import { useMenuState } from '../menu/use-menu-state';
import Screen from '../screen';
import { usePanelMenu } from './use-panel-menu';

type Props = {
    title: string;
    name: string;
    institution?: string;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};

/** Layout panel lembaga khusus HP. Di halaman sub-event, app bar punya tombol kembali ke event induk. */
export default function PanelScreen({ title, name, institution, dark, toggleTheme, children }: Props) {
    const { groups, parent } = usePanelMenu();
    const menu = useMenuState();

    return (
        <>
            <Head title={`${title} - Panel SIMPLE`} />
            <Toast />
            <Screen bottomNav bar={<AppBar title={title} back={parent?.href} />}>
                {children}
            </Screen>
            <MobileBottomNav variant="panel" onMenu={menu.show} />
            <MenuPanel
                open={menu.open}
                onClose={menu.hide}
                groups={groups}
                user={{ name, subtitle: institution ?? 'Lembaga' }}
                dark={dark}
                toggleTheme={toggleTheme}
                onLogout={() => router.post('/logout')}
            />
        </>
    );
}
