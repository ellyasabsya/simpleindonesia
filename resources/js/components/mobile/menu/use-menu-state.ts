import { useCallback, useEffect, useState } from 'react';

/** Status buka/tutup menu + tombol Escape + kunci gulir latar saat menu terbuka. */
export function useMenuState() {
    const [open, setOpen] = useState(false);
    const show = useCallback(() => setOpen(true), []);
    const hide = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    return { open, show, hide };
}
