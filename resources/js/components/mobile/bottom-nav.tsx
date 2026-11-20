import AndroidBottomNav from './android/bottom-nav';
import IosBottomNav from './ios/bottom-nav';
import type { NavProps } from './nav-types';
import { useNavConfig } from './use-nav-config';
import { usePlatform } from './use-platform';

// Pintu masuk bottom nav. Dipakai oleh layout (user, panel, landing) dan
// memilih tampilan iOS atau Android secara otomatis.
export default function MobileBottomNav({ variant, hasPanel, onMenu }: NavProps) {
    const platform = usePlatform();
    const config = useNavConfig(variant, hasPanel);

    return platform === 'ios' ? (
        <IosBottomNav {...config} onMenu={onMenu} />
    ) : (
        <AndroidBottomNav {...config} onMenu={onMenu} />
    );
}
