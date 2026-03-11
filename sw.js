// ── Service Worker — Παιχνίδια Γνώσεων ──────────────────────────────────────
const CACHE_NAME = 'gnosis-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './sw.js'
];

// Εγκατάσταση: cache των βασικών αρχείων και άμεση ενεργοποίηση
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Αμεση ενεργοποίηση χωρίς αναμονή — ώστε η νέα έκδοση να φορτωθεί γρήγορα
  self.skipWaiting();
});

// Ενεργοποίηση: καθαρισμός παλιών caches + claim + ειδοποίηση clients για reload
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => {
      // Ειδοποίηση όλων των ανοιχτών tabs για αυτόματο reload
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
});

// Fetch: network-first με fallback στην cache για offline λειτουργία
self.addEventListener('fetch', (e) => {
  // Μόνο GET requests
  if (e.request.method !== 'GET') return;
  // Μόνο same-origin requests
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Επιτυχής network response — ενημερώνουμε την cache
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — επιστρέφουμε από cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Αν δεν υπάρχει στην cache, επιστρέφουμε το index.html ως fallback
          return caches.match('./index.html');
        });
      })
  );
});
