import { Head } from '@inertiajs/react';
import { usePlatform } from '../use-platform';
import AndroidAuth from './android-auth';
import type { AuthScreenProps } from './auth-types';
import IosAuth from './ios-auth';

/** Layar login/daftar khusus HP. Dipanggil dari AuthLayout saat lebar layar HP. */
export default function AuthScreen(props: AuthScreenProps) {
    const ios = usePlatform() === 'ios';

    return (
        <>
            <Head title={`${props.pageTitle} - SIMPLE`} />
            {ios ? <IosAuth {...props} /> : <AndroidAuth {...props} />}
        </>
    );
}
