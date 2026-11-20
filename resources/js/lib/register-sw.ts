/**
 * Mendaftarkan service worker SIMPLE hanya di build produksi.
 * Saat versi baru siap, event "simple:sw-update" dikirim ke window
 * (UI pemberitahuan pembaruan dibuat di tahap berikutnya).
 */
export function registerServiceWorker(): void {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                const notify = () => {
                    if (registration.waiting && navigator.serviceWorker.controller) {
                        window.dispatchEvent(
                            new CustomEvent('simple:sw-update', { detail: registration }),
                        );
                    }
                };

                notify();
                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;
                    worker?.addEventListener('statechange', () => {
                        if (worker.state === 'installed') {
                            notify();
                        }
                    });
                });
            })
            .catch(() => {
                // Gagal mendaftar tidak boleh mengganggu aplikasi.
            });
    });
}
