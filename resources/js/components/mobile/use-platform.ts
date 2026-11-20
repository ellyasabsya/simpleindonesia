import { useSyncExternalStore } from 'react';

export type Platform = 'ios' | 'android';

const KEY = 'simple-ui-platform';

/**
 * Menentukan gaya tampilan: iPhone/iPad -> 'ios', lainnya -> 'android'.
 *
 * Untuk mencoba di komputer, tambahkan ke alamat:
 *   ?ui=ios      paksa tampilan iOS (diingat di browser ini)
 *   ?ui=android  paksa tampilan Android
 *   ?ui=auto     kembali ke deteksi otomatis
 */
function detect(): Platform {
    try {
        const q = new URLSearchParams(window.location.search).get('ui');
        if (q === 'ios' || q === 'android') {
            localStorage.setItem(KEY, q);
        } else if (q === 'auto') {
            localStorage.removeItem(KEY);
        }
        const saved = localStorage.getItem(KEY);
        if (saved === 'ios' || saved === 'android') {
            return saved;
        }
    } catch {
        // penyimpanan diblokir: abaikan, pakai deteksi otomatis
    }

    const ua = navigator.userAgent;
    const ios =
        /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes('Mac') && navigator.maxTouchPoints > 1);

    return ios ? 'ios' : 'android';
}

let cached: Platform | null = null;
const getSnapshot = (): Platform => (cached ??= detect());
const getServerSnapshot = (): Platform => 'android';
const subscribe = () => () => {};

export function usePlatform(): Platform {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
