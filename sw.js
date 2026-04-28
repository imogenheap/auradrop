const CACHE_NAME = 'auradrop-v1';
const BASE = '/auradrop';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache when offline
self.addEventListener('fetch', e => {
  // Don't intercept API calls
  if (e.request.url.includes('anthropic.com') || 
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('googleusercontent.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Background sync — fire when connectivity returns
self.addEventListener('sync', e => {
  if (e.tag === 'auradrop-sync') {
    e.waitUntil(notifyClients('sync-now'));
  }
});

function notifyClients(msg) {
  return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: msg }));
  });
}
