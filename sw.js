// ============================================================
//  SERVICE WORKER — Calepinage Pro v2
//  Cache first pour fonctionnement hors ligne
// ============================================================

const CACHE_NAME = 'calepinage-pro-v3';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/chantier-cards.css',
  '/js/state.js',
  '/js/validation.js',
  '/js/calcul.js',
  '/js/dessin.js',
  '/js/metre.js',
  '/js/export.js',
  '/js/exportPDF.js',
  '/js/exportExcel.js',
  '/js/api.js',
  '/js/projet.js',
  '/js/ui.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// --- Installation ---
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('Certains assets non mis en cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// --- Activation ---
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

// --- Fetch ---
self.addEventListener('fetch', function(e) {
  // Ignorer les requêtes non-GET et les API externes
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('calepinage-api')) return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
