// ── Service Worker — Παιχνίδια γνώσεων ──────────────────────────
const CACHE_NAME = 'pexnidia-gnoseon-v1';
const START_URL  = '/pexnidia-gnoseon./index.html';

// Αρχεία που αποθηκεύονται στη cache κατά την εγκατάσταση
const PRECACHE_URLS = [
  START_URL,
  '/pexnidia-gnoseon./',
];

// Εγκατάσταση: προ-αποθήκευση των βασικών αρχείων
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Αν αποτύχει η προ-αποθήκευση, συνεχίζουμε κανονικά
        return Promise.resolve();
      });
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

// Fetch: Network-first στρατηγική (πάντα φρέσκο περιεχόμενο)
self.addEventListener('fetch', (event) => {
  // Αγνόηση non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Αποθήκευση στη cache μόνο αν είναι επιτυχής απάντηση
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Αν δεν υπάρχει δίκτυο, επιστρέφουμε από cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(START_URL + 'index.html');
        });
      })
  );
});
