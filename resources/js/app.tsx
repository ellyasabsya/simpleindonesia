import './lib/auto-capitalize';
import { createInertiaApp } from '@inertiajs/react';
import { registerServiceWorker } from './lib/register-sw';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

registerServiceWorker();

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
});

const syncThemeColor = () => {
    const dark = document.documentElement.classList.contains('dark');
    document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((m) => m.remove());
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = dark ? '#0f172a' : '#ffffff';
    document.head.appendChild(meta);
};
syncThemeColor();
new MutationObserver(syncThemeColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
});
