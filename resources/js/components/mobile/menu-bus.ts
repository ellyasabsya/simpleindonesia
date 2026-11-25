import { useSyncExternalStore } from 'react';

let handler: (() => void) | null = null;
const subs = new Set<() => void>();

/** Dipanggil bar bawah: mendaftarkan fungsi pembuka menu (null = tidak ada menu). */
export function setMenuHandler(h: (() => void) | null) {
    if ((handler === null) === (h === null)) {
        handler = h;
        return;
    }
    handler = h;
    subs.forEach((f) => f());
}

export function openMenu() {
    handler?.();
}

/** Bar atas memakai ini untuk tahu apakah tombol Menu perlu ditampilkan. */
export function useHasMenu(): boolean {
    return useSyncExternalStore(
        (cb) => {
            subs.add(cb);
            return () => {
                subs.delete(cb);
            };
        },
        () => handler !== null,
        () => false,
    );
}
