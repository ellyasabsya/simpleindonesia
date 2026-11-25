import { useEffect } from 'react';
import IosBottomNav from './ios/bottom-nav';
import { setMenuHandler } from './menu-bus';
import type { NavProps } from './nav-types';
import { useNavConfig } from './use-nav-config';

// Pintu masuk bottom nav. Tombol Menu tidak lagi di bar bawah: pembuka menu dititipkan ke bar atas.
export default function MobileBottomNav({ variant, hasPanel, onMenu }: NavProps) {
    const config = useNavConfig(variant, hasPanel);

    useEffect(() => {
        setMenuHandler(onMenu ?? null);
        return () => setMenuHandler(null);
    }, [onMenu]);

    return <IosBottomNav {...config} />;
}
