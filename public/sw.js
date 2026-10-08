/* Service Worker
 * Cache name memakai APP_VERSION — naikkan setiap rilis aset penting (peta, ikon, dll).
 * Saat versi baru aktif: cache lama dihapus otomatis, klien di-reload.
 */
const APP_VERSION = '0.1.17';
const CACHE_STATIC = 'app-static-' + APP_VERSION;
const CACHE_PAGES = 'app-pages-' + APP_VERSION;

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icon-192.png',
  '/logo.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then(function (cache) {
        return cache.addAll(PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE_STATIC && k !== CACHE_PAGES;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'SW_ACTIVATED', version: APP_VERSION });
        });
      })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Navigasi: network dulu, offline → index */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_PAGES).then(function (c) {
            c.put(request, copy);
          });
          return res;
        })
        .catch(function () {
          return caches.match('/index.html');
        })
    );
    return;
  }

  /* Bundle JS/CSS hashed: cache-first aman (nama file berubah tiap build) */
  if (url.pathname.indexOf('/assets/') === 0) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        return (
          cached ||
          fetch(request).then(function (res) {
            if (res && res.status === 200) {
              var copy = res.clone();
              caches.open(CACHE_STATIC).then(function (c) {
                c.put(request, copy);
              });
            }
            return res;
          })
        );
      })
    );
    return;
  }

  /*
   * Gambar peta, karakter, musik kota, dll:
   * NETWORK-FIRST — update aset (peta baru) langsung terambil online,
   * offline tetap pakai cache.
   */
  if (
    url.pathname.indexOf('/cities/') === 0 ||
    url.pathname.indexOf('/sounds/') === 0 ||
    url.pathname.indexOf('/characters/') === 0 ||
    /\.(png|jpg|jpeg|webp|svg|mp3|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(function (cache) {
        return fetch(request)
          .then(function (res) {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(function () {
            return cache.match(request);
          });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(function () {
      return caches.match(request);
    })
  );
});
