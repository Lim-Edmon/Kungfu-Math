/* Service Worker Kungfu Math
 * Cache name memakai versi app — naikkan saat rilis (sinkron package.json version).
 * Author: Lim Edmon
 */
const APP_VERSION = '0.1.4';
const CACHE_STATIC = 'kungfu-math-static-' + APP_VERSION;
const CACHE_PAGES = 'kungfu-math-pages-' + APP_VERSION;

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
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

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

  if (
    url.pathname.indexOf('/cities/') === 0 ||
    url.pathname.indexOf('/sounds/') === 0 ||
    url.pathname.indexOf('/characters/') === 0 ||
    /\.(png|jpg|jpeg|webp|svg|mp3|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(function (cache) {
        return cache.match(request).then(function (cached) {
          var network = fetch(request)
            .then(function (res) {
              if (res && res.status === 200) cache.put(request, res.clone());
              return res;
            })
            .catch(function () {
              return cached;
            });
          return cached || network;
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
