import { useSyncExternalStore } from 'react';

/** Lebar maksimum yang dianggap HP. Di atas ini layout desktop dipakai apa adanya. */
export const PHONE_QUERY = '(max-width: 767px)';

const subscribe = (cb: () => void) => {
    const mq = window.matchMedia(PHONE_QUERY);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};
const getSnapshot = () => window.matchMedia(PHONE_QUERY).matches;
const getServerSnapshot = () => false;

/**
 * true jika layar selebar HP. Dipakai sebagai satu-satunya saklar antara
 * layout desktop (tidak diubah) dan layout native iOS/Android.
 */
export function usePhone(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
