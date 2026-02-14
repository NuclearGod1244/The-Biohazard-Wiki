const CACHE_NAME = "biohazard-cache-a2.0.1";
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
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
