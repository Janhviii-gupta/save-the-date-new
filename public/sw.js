// Save The Date — Janhvi & Krish Lightweight PWA Service Worker
const CACHE_NAME = 'jk-wedding-std-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/onepage.html',
  '/manifest.json',
  '/reveal-photos/photo-1944.jpg',
  '/achrol-niwas.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Precache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => {
        return caches.match('/onepage.html');
      });
    })
  );
});
