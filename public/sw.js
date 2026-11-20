/*
 * Service worker SIMPLE (Tahap 2: fondasi).
 *
 * Aturan keamanan:
 * - HTML TIDAK PERNAH disimpan. Halaman Inertia membawa data pengguna
 *   (nama, email, role, notifikasi), jadi semua navigasi selalu ke server.
 * - Yang disimpan hanya berkas statis publik: /build/assets/* (nama ber-hash),
 *   /icons/*, dan /offline.html.
 * - Request non-GET, lintas domain (Midtrans, font CDN), dan XHR Inertia
 *   tidak disentuh sama sekali. Berkas /storage dan semua halaman (termasuk
 *   admin, panel, pembayaran) hanya lewat jaringan, tidak pernah di-cache.
 */
const VERSION = 'v1';
const STATIC_CACHE = `simple-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];
const MAX_STATIC_ENTRIES = 250;

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
    // Tidak memanggil skipWaiting otomatis: versi baru menunggu sampai
    // pengguna menyetujui (lihat pesan SKIP_WAITING di bawah).
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            await Promise.all(
                names
                    .filter((n) => n.startsWith('simple-') && n !== STATIC_CACHE)
                    .map((n) => caches.delete(n)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function trimCache(cache) {
    const keys = await cache.keys();
    if (keys.length <= MAX_STATIC_ENTRIES) return;
    await Promise.all(keys.slice(0, keys.length - MAX_STATIC_ENTRIES).map((k) => cache.delete(k)));
}

async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
        void trimCache(cache);
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (request.headers.has('X-Inertia')) return;

    // Berkas statis ber-hash dan ikon: cache-first.
    if (url.pathname.startsWith('/build/assets/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Navigasi halaman: selalu ke jaringan. Hanya jika jaringan gagal,
    // tampilkan halaman offline statis. Respons server (termasuk 4xx/5xx) tidak diubah.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(STATIC_CACHE);
                return (await cache.match(OFFLINE_URL)) || Response.error();
            }),
        );
    }
});
