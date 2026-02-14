const CACHE_NAME = "biohazard-cache-a2.0.3";
const FILES_TO_CACHE = [
  "/error.html",
  "/index.html",
  "/lore.html",
  "/adminstatus.html",
  "/gamestatuses.html",
  "/howtoapply.html",
  "/style.css",
  "/script.js"
];


self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});


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
    )
  );
  self.clients.claim();
});


self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(response =>
        response || fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
      )
    )
  );
});


