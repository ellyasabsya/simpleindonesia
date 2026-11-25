import MenuSheet from './ios-menu-sheet';
import type { MenuPanelProps } from './menu-types';

/** Menu samping: satu sheet bawah untuk iOS dan Android. */
export default function MenuPanel(props: MenuPanelProps) {
    return <MenuSheet {...props} />;
}
