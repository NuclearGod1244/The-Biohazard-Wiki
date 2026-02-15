const CACHE_NAME = "biohazard-cache-b2.5.1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];


/* ------------------------------
   INSTALL
--------------------------------*/
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});


/* ------------------------------
   ACTIVATE
--------------------------------*/
self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
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
      fetch(event.request, { cache: "no-store" })
    );
    return;
  }

  // Network-first for HTML (prevents stale page)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Cache-first for assets
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
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
