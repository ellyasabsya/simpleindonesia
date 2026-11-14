import { useCallback, useEffect, useState } from 'react';

function apply(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    try {
        localStorage.setItem('appearance', dark ? 'dark' : 'light');
        document.cookie = `appearance=${dark ? 'dark' : 'light'};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
        /* abaikan */
    }
}

export function useTheme() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem('appearance');
        } catch {
            /* abaikan */
        }
        const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDark(isDark);
        apply(isDark);
    }, []);

    const toggle = useCallback(() => {
        setDark((prev) => {
            apply(!prev);
            return !prev;
        });
    }, []);

    return { dark, toggle };
}
