const CACHE_NAME = "biohazard-cache-a2.2.1";

const FILES_TO_CACHE = [
    "./",
    "./error.html",
    "./index.html",
    "./lore.html",
    "./adminstatus.html",
    "./gamestatuses.html",
    "./howtoapply.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];

/* ---------------- INSTALL ---------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => {
      return self.skipWaiting(); // 🔥 FORCE ACTIVATE ASAP
    })
  );
});

/* ---------------- ACTIVATE ---------------- */
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

/* ---------------- FETCH ---------------- */
self.addEventListener("fetch", event => {

  if (event.request.mode === "navigate") {
    // Network first for HTML
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for everything else (CSS, JS, etc.)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


/* ---------------- MESSAGE ---------------- */
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
