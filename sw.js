// ── Service Worker — Παιχνίδια γνώσεων ──────────────────────────
const CACHE_NAME = 'pexnidia-gnoseon-v3';
const START_URL  = './index.html';

// Εγκατάσταση: αποθήκευση μόνο του index.html
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(START_URL).catch(() => Promise.resolve());
    })
  );
  self.skipWaiting();
});

// Ενεργοποίηση: καθαρισμός παλιών caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first στρατηγική
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cached) => cached || caches.match(START_URL));
      })
  );
});
