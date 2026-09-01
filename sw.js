// Save The Date — Janhvi & Krish Cache Buster & Service Worker Purger
// This script automatically purges all old caches and unregisters service workers so all users see the latest deployed version immediately.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh from network directly — bypass all caches
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
