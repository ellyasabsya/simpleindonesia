import type { AppBarProps } from './app-bar-types';
import IosAppBar from './ios/app-bar';

/** Pintu masuk tunggal: satu tampilan untuk iOS dan Android. */
export default function AppBar(props: AppBarProps) {
    return <IosAppBar {...props} />;
}
