import type { MouseEvent } from 'react';

// Gulung ke section tanpa menambah riwayat browser (tombol Back tidak berantakan).
export function goTo(e: MouseEvent<HTMLElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
}
