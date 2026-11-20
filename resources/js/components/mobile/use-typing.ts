import { useEffect, useState } from 'react';

const FIELD =
    'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="file"]):not([type="range"]), textarea, select, [contenteditable="true"]';

/** True saat kolom input sedang fokus (keyboard layar terbuka). Bar disembunyikan agar tidak melayang di atas keyboard. */
export function useTyping() {
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onIn = (e: FocusEvent) => {
            clearTimeout(timer);
            if (e.target instanceof Element && e.target.matches(FIELD)) {
                setTyping(true);
            }
        };
        const onOut = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const el = document.activeElement;
                setTyping(el instanceof Element && el.matches(FIELD));
            }, 80);
        };
        document.addEventListener('focusin', onIn);
        document.addEventListener('focusout', onOut);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('focusin', onIn);
            document.removeEventListener('focusout', onOut);
        };
    }, []);

    return typing;
}
