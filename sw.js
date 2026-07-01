// ============================================================
//  SERVICE WORKER — Calepinage Pro
//  Cache first pour fonctionnement hors ligne
// ============================================================

const CACHE_NAME = 'calepinage-pro-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/state.js',
  '/js/calcul.js',
  '/js/dessin.js',
  '/js/metre.js',
  '/js/export.js',
  '/js/ui.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// --- Installation : mise en cache de tous les assets ---
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// --- Activation : suppression des anciens caches ---
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// --- Fetch : cache first, fallback réseau ---
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Mettre en cache les nouvelles ressources
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      // Hors ligne et pas en cache → page de fallback
      if (e.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
