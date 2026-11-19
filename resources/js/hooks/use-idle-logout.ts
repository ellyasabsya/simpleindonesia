import { router } from '@inertiajs/react';
import { useEffect } from 'react';

const KEY = 'last_activity_at';
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

/** Keluarkan pengguna otomatis kalau tidak ada aktivitas selama `minutes` menit (sinkron antar tab). */
export function useIdleLogout(minutes = 30, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const limit = minutes * 60 * 1000;
        let lastWrite = 0;

        const touch = () => {
            const now = Date.now();
            if (now - lastWrite < 5000) return; // batasi tulis tiap 5 detik
            lastWrite = now;
            try { localStorage.setItem(KEY, String(now)); } catch { /* abaikan */ }
        };

        const lastSeen = () => {
            try { return Number(localStorage.getItem(KEY)) || Date.now(); } catch { return Date.now(); }
        };

        touch();
        EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));

        const timer = setInterval(() => {
            if (Date.now() - lastSeen() < limit) return;
            clearInterval(timer);
            router.post('/logout', {}, {
                onFinish: () => { window.location.href = '/login?expired=1'; },
            });
        }, 15000);

        return () => {
            clearInterval(timer);
            EVENTS.forEach((e) => window.removeEventListener(e, touch));
        };
    }, [minutes, enabled]);
}
