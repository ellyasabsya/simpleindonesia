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
