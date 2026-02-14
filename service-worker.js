const CACHE_NAME = "biohazard-cache-a2.3.6";

const FILES_TO_CACHE = [
    "./",
    "./style.css",
    "./script.js",
    "./manifest.json"
];

/* ------------------------------
   INSTALL
--------------------------------*/
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

/* ------------------------------
   ACTIVATE
--------------------------------*/
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* ------------------------------
   FETCH
--------------------------------*/
self.addEventListener("fetch", event => {

  const requestURL = new URL(event.request.url);

  // 🚀 NEVER cache status.json
  if (requestURL.pathname.endsWith("status.json")) {
    event.respondWith(
      fetch(event.request, {
        cache: "no-store"
      })
    );
    return;
  }

  // Normal cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

/* ------------------------------
   MESSAGE
--------------------------------*/
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
