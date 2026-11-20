import { usePlatform } from '../use-platform';
import AndroidDrawer from './android-drawer';
import IosMenuSheet from './ios-menu-sheet';
import type { MenuPanelProps } from './menu-types';

/** Menu samping: lembar dari bawah di iOS, drawer dari kiri di Android. */
export default function MenuPanel(props: MenuPanelProps) {
    return usePlatform() === 'ios' ? <IosMenuSheet {...props} /> : <AndroidDrawer {...props} />;
}
