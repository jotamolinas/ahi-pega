const CACHE_NAME = 'tv-media-cache-v1';
const FALLBACK_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 600" fill="black"><rect width="100%" height="100%" fill="black"/><text x="50%" y="45%" font-family="monospace" font-size="40" fill="%23d946ef" text-anchor="middle" dominant-baseline="middle">Ahí Pega!</text><text x="50%" y="55%" font-family="monospace" font-size="20" fill="%2394a3b8" text-anchor="middle" dominant-baseline="middle">Sin Conexión a Internet</text><text x="50%" y="62%" font-family="monospace" font-size="14" fill="%2364748b" text-anchor="middle" dominant-baseline="middle">Reproduciendo desde Caché (si está disponible)</text></svg>';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.put(
        new Request('/fallback-offline.svg'), 
        new Response(FALLBACK_SVG, { headers: { 'Content-Type': 'image/svg+xml' } })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass videos, audio and range requests
  if (
    request.destination === 'video' ||
    request.destination === 'audio' ||
    request.headers.has('range') ||
    url.pathname.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i)
  ) {
    return;
  }

  // Intercept images for offline fallback
  const isImage = request.destination === 'image' || url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg)(\?.*)?$/i);

  if (isImage && request.url.startsWith('http')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Cache First Strategy
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'error') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
           // Fallback de Emergencia
           return caches.match('/fallback-offline.svg');
        });
      })
    );
  }
});
