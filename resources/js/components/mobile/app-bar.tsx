import AndroidAppBar from './android/app-bar';
import type { AppBarProps } from './app-bar-types';
import IosAppBar from './ios/app-bar';
import { usePlatform } from './use-platform';

/** Pintu masuk tunggal: layout cukup memanggil <AppBar />, platform dipilih otomatis. */
export default function AppBar(props: AppBarProps) {
    return usePlatform() === 'ios' ? (
        <IosAppBar {...props} />
    ) : (
        <AndroidAppBar {...props} />
    );
}
